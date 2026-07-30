<h1 align=middle>Omnitech</h1>

<h1 align=middle>Testing policy doc</h1>
This is the testing policy document for team omnitech which details the structure of the project. The purpose of this document is to ensure that coding standards are kept and that all code that reaches our production is tested and must remain easily maintainable.

<h2 align=middle>Testing procedures</h2>

Our project's testing strategy is structured as follows:
### 1.Automated tests 
All tasks, including unit and integration tests, are automated to ensure the code is consistently tested and meets quality standards.
### 2.Continuous feedback through CI 
Testing is integrated into our CI to ensure immediate feedback after every pull request 

<h2 align=middle>Testing tools and justification</h2>

The following frameworks and tools were used during tests:
 
### 1. Jest:
jest was used because it is native to the language used in our backend (typescript). It also allows for parallel execution of tests which allows for tests to be evaluated faster. Jest was used for our unit tests because it allows for built-in mocking.
### 2. supertest:
Supertest was used by integration because it provides the network simulation layer needed for HTTP requests. Supertest is a complimentary pairing with jest for node.js(typescript) backends.

### 3. Continuous Integration (CI) github actions:
Our testing pipeline is implemented using GitHub Actions to automate the execution of unit and integration tests. GitHub Actions was chosen because it provides native integration with the repository, making it straightforward to configure and maintain. This simplifies the continuous integration (CI) process by reducing the need for additional third-party tools while ensuring that tests are run automatically on every change, helping to maintain code quality and reliability.

<h2 align=middle>Test procedure</h2>

### 1. Unit tests:
Two levels of unit testing were implemented in the project: controller-level tests and service-level tests. Dependencies between layers, such as the Prisma data access layer, were mocked to isolate the components under test. This approach ensured that each backend endpoint and service could be tested independently using Jest, allowing individual units to be validated without relying on external dependencies. As a result, tests execute quickly, provide reliable feedback, and help verify the correctness of the application's business logic.
### 2. Integration tests:
Integration tests were implemented by making a test db to prevent any mocking of services. supertest was used for the simulation of endpoint calls and checking whether  the endpoint interacts as expected with the db and other functions, also to check whether the different levels a communicating as expected.
### 3. End-to-End (e2e) tests:
For end-to-end testing, UI Automator with JUnit 4 was used to simulate user interactions by stepping through the application according to the five defined use cases. This was achieved by assigning tags to the required input fields and user interface elements, allowing the automation framework to accurately identify and interact with components on the screen.

These tests validate the complete application workflow by exercising both the frontend and backend. The automated tests interact with the user interface as a real user would while making actual API calls to the backend, ensuring that the application's functionality operates correctly from end to end. This approach also verifies that user interface elements remain functional and that integration between the frontend and backend is working as expected.

### 4. Overall procedure: 
As new units of functionality were implemented, the team was required to write and maintain corresponding automated tests. Before a pull request (PR) could be approved, all tests had to pass and the project was required to maintain a minimum test coverage of 80%.

This process was enforced automatically through GitHub Actions, which executed the test suite and verified code coverage for every pull request. By integrating these checks into the continuous integration (CI) pipeline, only well-tested, maintainable code that met the project's quality standards could be merged into the shared branches.

