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
     * - identifier can be username OR user_id
     * - disallow adding yourself
     * - disallow duplicates
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
        const full_name = `${target_user ?? ""} ${target_user.surname ?? ""}`.trim() || target_user.username;

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
}