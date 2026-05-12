import prisma from '../db/prisma';

//Helper: check if identifier looks like a UUID : uses Regex
function is_uuid(value: string): boolean {
    //8  hex chars - 4 hex chars - uuid version(first char must be 1-5, then 3 hex chars) - uuid variant(first char must be 8,9,a or b, then 3 hex chars) - 12 hex chars
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value,);
}

//throw errors with a code so controllers can map them to API error responses
function coded_error(code: string){
    const err: any = new Error(code);
    err.code = code;
    return err;
}


export const contact_services ={
    /**
     * Creates a trusted contact row for owner user_id by looking up the target user.
     *
     * identifier can be username OR user_id
     * disallow adding yourself
     * disallow duplicates
    */
    async create_trusted_contact(user_id: string, identifier: string){
        //look up the target user either by uuid or username
        const where = is_uuid(identifier) ? {user_id: identifier} : {username: identifier};

        const target_user = await prisma.users.findFirst({
            where,
            select: {
                user_id: true,
                username: true,
                name: true,
                surname: true,
                email: true,
            },
        });

        if(!target_user) throw coded_error("USER_NOT_FOUND");
        if(target_user.user_id === user_id) throw coded_error("CANNOT_ADD_USER");

        //check if contact already exists for this owner
        const existing = await prisma.trusted_contacts.findFirst({
            where: {
                user_id,
                contact_user_id: target_user.user_id,
            },
            select: { contact_id: true},
        });

        if(existing) throw coded_error("ALREADY_TRUSTED_CONTACT");

        //choose "name" to store for trusted contact row
        const full_name = `${target_user.name ?? ""} ${target_user.surname ?? ""}`.trim() || target_user.username;

        //create trusted contact record
        const created = await prisma.trusted_contacts.create({
            data: {
                user_id,
                contact_user_id: target_user.user_id,
                name: full_name,
                email: target_user.email,
            },
            select: {contact_id: true},
        });

        // Controller expects to return contact_id + username
        return {
            contact_id: created.contact_id,
            username: target_user.username,
        };
    },

    //Returns the user's trusted contacts.
    async list_trusted_contacts(user_id: string){
        const contacts = await prisma.trusted_contacts.findMany({
            where: {user_id},
            select: {
                contact_id: true,
                name: true,
                email: true,
                contact_user: {
                    select: { username: true},
                },
            },
            orderBy: {created_at: "desc"},
        });

        //Map to response shape
        return contacts.map((c) => ({
            contact_id: c.contact_id,
            username: c.contact_user.username,
            name: c.name,
            email: c.email,
        }));
    },

    /**
     * Creates an alert tied to a trip event, then creates notifications for each contact.
     *
     * event_id is the unique event that took place during a trip (trip_events).
   */
    async alert_contacts_for_event(input: {
        user_id: string;
        event_type: string;
        event_id: string;
        message: string | null;
        contact_ids: string[];
    }) {
        const { user_id, event_type, event_id, message, contact_ids } = input;

        //find trip event to get trip_id
        const trip_event = await prisma.trip_events.findUnique({
            where: { event_id },
            select: { trip_id: true },
        });
        if(!trip_event) throw coded_error("EVENT_NOT_FOUND");

        //ensure trip belongs to this user
        const trip = await prisma.trips.findUnique({
            where: { trip_id: trip_event.trip_id },
            select: { user_id: true },
        });
        if(!trip || trip.user_id !== user_id) throw coded_error("CANNOT_ACCESS_CONTACTS");

        //ensure all contacts ids exist and belong to this user
        const found = await prisma.trusted_contacts.findMany({
            where: { user_id, contact_id: { in: contact_ids } },
            select: { contact_id: true },
        });
        if(found.length !== contact_ids.length) throw coded_error("CONTACT_NOT_FOUND");

        //create alert and notifications rows in a transaction
        await prisma.$transaction(async (tx) => {
            const alert = await tx.alerts.create({
                data: {
                    trip_id: trip_event.trip_id,
                    user_id,
                    alert_type: event_type,
                    event_id,
                    message: message ?? undefined,
                    recorded_at: new Date(),
                },
                select: {alert_id: true },
            });
            await tx.alert_notifications.createMany({
                data: contact_ids.map((contact_id) => ({
                    alert_id: alert.alert_id,
                    contact_id,
                })),
            });
        });
    },

    //shares trip location with contacts until end of trip
    //share is considered active if revoked_at is null and trip.end_time is null
    async share_trip_location(input: { 
        user_id: string;
        trip_id: string;
        contact_ids: string[]
    }){
        const { user_id, trip_id, contact_ids } = input;

        //ensure trip exists and belongs to the user
        const trip = await prisma.trips.findUnique({
            where: {trip_id},
            select: { trip_id: true, user_id: true, end_time: true},
        });
        if( !trip || trip.user_id !== user_id) throw coded_error("TRIP_NOT_FOUND");

        //ensure all contacts are trusted contacts owned by this user
        const trusted = await prisma.trusted_contacts.findMany({
            where: { user_id, contact_id: { in: contact_ids } },
            select: {
                contact_id: true,
                contact_user: { select: { username: true } },
            },
        });
        if(trusted.length !== contact_ids.length) throw coded_error("NOT_TRUSTED_CONTACT");

        //create share rows (skip duplicates so the same trip can be shared again)
        const shared_at = new Date();
        await prisma.trip_location_shares.createMany({
            data: trusted.map((c) => ({
                trip_id, 
                owner_user_id: user_id,
                contact_id: c.contact_id,
                shared_at,
            })),
            skipDuplicates: true,
        });

        //return data in format of endpoint
        return {
            trip_id,
            shared_at: shared_at.toISOString(),
            shared_with: trusted.map((c) => ({
                contact_id: c.contact_id,
                username: c.contact_user.username,
            })),
        };
    },
};