<h1 align=middle>Coding standards</h1>


<h2 align=middle>1.Introduction </h2>

This doc provides coding standards and guidelines used by omnitech to ensure quality, maintainability, and consistency for the driving tracker project.
 
<h2 align=middle>General guidelines</h2>

Write clean, readable and maintainable code. Follow KISS(Keep it Simple, Stupid) principles.
 
<h2 align=middle>Naming Conventions</h2>

The naming conventions used throughout the project are specificied below, these standards are used to ensure that code is readable and maintainable across to the entire project
### 3.1 Backend
Through out the entire backend of the project convention used is snake_case,
#### 3.1.1 Variables 
- Variables in the backend are given meaningful and descriptive names\
Good example:
```
user_id: string ;
```
Bad example:
```
ud: string;
```
#### 3.1.2 Functions
- Use of descriptive names to understand what the function is meant to do.
```
async get_all_vehicles(data:get_vehicles): Promise<any[]>{
        const user_id = data.user_id;
        if(!user_id){
            throw new Error("Missing field(s)");
        }
         // the rest of the code 
```
### 3.2 Frontend
- Majority of the project's frontend is based on kotlin where we chose to use camelCase for naming functions and variables
#### 3.2.1 Variables 
- Variables in the backend are given meaningful and descriptive names\
Good example:
```
subscriptionKey: String
```
Bad example:
```
sKey: String
```
#### 3.2.2 Functions and Classes 
- Use of descriptive names to understand what the function is meant to do.
```
class TripSummaryViewModel @Inject constructor(private val repository: TripRepository) 
```

<h2 align=middle>4.Commenting</h2>

- Use of inline comments sparingly and only for complex or non-obvious code blocks 
- While the use of Block comments is used to explain code sections 
```
  // Otherwise try to convert to number
    return Number(value);
```
    export const contact_services ={
    /**
     * Creates a trusted contact row for owner user_id by looking up the target user.
     *
     * identifier can be username OR user_id
     * disallow adding yourself
     * disallow duplicates
    */


<h2 align=middle>5.Code Structure</h2> 

 ### 5.2 Indentation 
 - The indentation used throughout the project is standard indentation of four spaces (via tab) and two spaces in the html and javascript components of the app
```
export const trips_services ={
    async create(data: create_trip){
        if(!data.user_id || !data.vehicle_id ){
            throw new Error("Missing required fields");
        }
```
### 5.3 File structure 
- The backend is structured in the manner of services, routes and controllers 
```
Driving-Tracker/
  android-app/
  backend/
  docs/
  frontend/
```



<h2 align=middle>6.Testing </h2>

- Unit tests are used to check the controller level and services of the api 
- Integration tests are being used to test the endpoints with the different http request 
- End-to-End tests are used to test the five core use cases simulating a using stepping through the application and proper rendering


<h2 align=middle>7.Error Handling </h2>

- Use try-catch blocks to handle exceptions in the webview and the processing of api requests 
```
 try{
            //where the creation of the trip will happen
            const user = await prisma.users.findUnique({
                where: {user_id: data.user_id}
            });
            if(!user){
                throw new Error("user not found");
            } ...}catch(error){
            throw error;
        }
```

<h2 align=middle>8.Code Review </h2>

- Our code is reviewed after each pr with codeCov and sonarCube to ensure that code is of standard 
- Builds are checked after each pr to ensure maintainable code is in our project 

