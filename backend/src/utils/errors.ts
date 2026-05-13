
export class ValidationError extends Error{

    constructor(message: string, public field: string){
        super(message);
        this.name="ValidationError";
    }

    get errorCode():string{
        return "INVALID_"+ this.field.toUpperCase();
    }
}

export class ConflictError extends Error{

    constructor(message: string, public field: "email"|"username"){
        super(message);
        this.name="ConflictError";
    }

    get errorCode():string{
        return this.field.toUpperCase()+"_TAKEN";
    }
}

export class ExtendedError extends Error{

    constructor(message: string, public errorCode: string){
        super(message);
        this.name="ConflictError";
    }
}