# File Data Reporting Service MnS

TS 28.532 defines the file data reporting service to provide OAM data in the form of files which are categorized under 4 categories, namely: Performance, Proprietary, Analytics, and Trace. The service defines 3 endpoints:

-   **GET** /files - read information about available files.
-   **POST** /subscriptions - create a subscription to be notified of when files become available.
-   **DELETE** /subscriptions/{subscriptionId} - delete a subscription.

This service has been extended with the following endpoints:

-   **POST** /files - create a file report.
-   **GET** /files/{fileId} - read the contents of a single file.
-   **DELETE** /files/{fileId} - delete a file
-   **POST** /files/create_many - bulk create file reports.
-   **GET** /subscriptions/{subscriptionId} - read a subscription.

More information can be found in [this confluence page.](https://beintelli.atlassian.net/wiki/spaces/COBRA5G/pages/1101594632/OAM+Data+Collection+for+the+NWDAF)

## Running the server

-   Tested with Node version 18.9.0.
-   Add the DB_URI in the [.env.{local|prod|test} file](./.env.example).
-   The server runs on port 8080 by default or you can change it in [config.ts](./src/config.ts)

```bash
npm i
npm run build
npm start
```

Head over to http://localhost:8080/api-docs for the API documentation.

### Example creating a file report

POST request to http://localhost:8080/fileDataReportingMnS/v1/file with the following request body:

```json
{
	"fileContent": {
		"host": "EDGE_PC",
		"installed_softwares": ["sql", "pip", "python"]
	},
	"fileDataType": "Proprietary",
	"fileReadyTime": "2023-10-30T00:00:00+01:00"
}
```

## Development

```
npm i
npm run dev
```

## Tests

```
## run all tests
npm run test

## run integration tests
npm run test:integ
```

## General Code Structure

The initial code was generated with the [OpenAPI generator](https://openapi-generator.tech/docs/installation/) and later modified to meet our needs.

### Root Directory:

#### index.ts

The entry point of the application. Routers, Controllers, Services, and Data Sources are initialized here.

#### src/

This contains the main server functionalities.

-   **expressServer.ts** - This is where the express server is initialized, together with the OpenAPI validator, OpenAPI UI, and other libraries needed to start our server. If we want to add external links, that's where they would go. Our project uses the [express-openapi-validator](https://www.npmjs.com/package/express-openapi-validator) library that acts as a first step in the routing process - requests that are directed to paths defined in the `openapi.yaml` file are caught by this process, and it's parameters and bodyContent are validated against the schema. A successful result of this validation will be a new 'openapi' object added to the request. If the path requested is not part of the openapi.yaml file, the validator ignores the request and passes it on, as is, down the flow of the Express server.

-   **api/**

    -   **openapi.yaml** - This is the OpenAPI contract to which this server will comply. The file was generated using the codegen, and should contain everything needed to run the API Gateway - no references to external models/schemas. The OpenAPI validator will validate the requests (and responses) against this OpenAPI schema.

<!-- -   **utils/** - Currently a single file. This came with the generated server and has not been modified since.
    -   **openapiRouter.js** - This is where the routing to our back-end code happens. If the request object includes an `openapi` object, it picks up the following values (that are part of the `openapi.yaml` file): 'x-openapi-router-controller', and 'x-openapi-router-service'. These variables are names of files/classes in the controllers and services directories respectively. The operationId of the request is also extracted. The operationId is a method in the controller and the service that was generated as part of the codegen process. The routing process sends the request and response objects to the controller, which will extract the expected variables from the request, and send it to be processed by the service, returning the response from the service to the caller. -->

-   **routers/** - Routes are defined here and it should reflect the routes defined in `api/openapi.yaml`. We can optionally use the [x-eov-operation-handler](https://github.com/cdimascio/express-openapi-validator/tree/master/examples/3-eov-operations) defined in each endpoints in the `api/openapi.yaml` file and it would route the requests directly to the Controllers. However, this would cause delay in the initial requests.

    -   **FilesRouter.ts and SubscriptionsRouter.ts** - Express Router that defines file- and subscription-related routes and calls its corresponding handlers.

-   **controllers/** - After validating the request, and ensuring this belongs to our API gateway, we send the request to a `controller`, where the variables and parameters are extracted from the request and sent to the relevant `service` for processing. The `controller` handles the response from the `service` and builds the appropriate HTTP response to be sent back to the user.

    -   **Controller.ts** - A class responsible for handling generic HTTP requests and responses.
    -   **FilesController.ts and SubscriptionsController.ts** - handles requests and responses for file- and subscription-related endpoints.
    -   Both the FilesController.ts and SubscriptionsController.ts calls the methods provided by `Controller.ts`.

-   **services/**
    -   **FilesService.ts and SubscriptionsService.ts** - Manages file- and subscription-related CRUD operations by serving as an intermediary between the HTTP requests and the underlying data source.
-   **common/**
    -   **database/** - contains files for handling database interaction. The current implementation uses MongoDB to store the files and subscriptions. If it were to change in the future, we can define a new class that implements the interfaces in `database/interfaces/` and plug in a different database.
