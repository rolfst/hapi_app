# Flex-Appeal NodeJS API Documentation

## General
This repository contains the server side JavaScript part of the Flex-Appeal API.  
The project is build with the great API framework [HapiJS](https://hapijs.com).

## Usage

To test the application there are a few commands:

  - `npm run check` Runs all tests and linter (NOTE: Run this before `git push`!)
  - `npm run test` Runs all tests
  - `npm run test:unit` Runs all unit tests
  - `npm run test:e2e` Runs all e2e tests
  - `npm run lint` Runs the linter

When debugging SQL queries you can pass the `SQL_LOGGING=true` flag when executing a npm command in your terminal.
For example `SQL_LOGGING=true npm run dev` would log all the SQL queries being executed by Sequelize.

To run the application locally one can use:

  `npm run dev`

It is possible to generate some documentation about the method interfaces which are located in the docs directory:

  `npm run doc`

## Testing

Tests make use of Mocha as the test runner and Chai as the assertion framework.

To run the e2e test individually you can use:
```
API_ENV=testing node_modules/.bin/_mocha --opts ./mocha.opts  <file_or_folder_under_test>
```
Whereas `./test-bootstrap.js` contains the logic that provides the assertion framework and the usage of babel

To run the unit test individually one can use:
```
API_ENV=testing node_modules/.bin/_mocha --opts ./mocha-spec.opts  <file_or_folder_under_test>
```
## Debugging

To run the test with debugging use:
```
API_ENV=testing node --inspect --debug-brk node_modules/.bin/_mocha --opts ./mocha-spec.opts  <file_or_folder_under_test>
```

This will halt the execution of the test till a debug client can attach itself to the process and this will pause the debugger on the first line.

## File Structure
```
|-- migrations  
|-- scripts  
|-- source  
    |-- modules  
        |-- my-cool-module  
            |-- handlers  
            |-- models  
            |-- repositories  
                |-- dao  
            |-- services  
            |-- validators  
            create-routes.js  
    |-- shared  
        |-- configs  
        |-- mails  
        |-- middlewares  
        |-- services  
        |-- test-utils  
        |-- utils
```

## Authentication
Users can authenticate with our API via the `/authenticate` endpoint which creates a JWT token. This JWT token expires 60 minutes after issued. In HapiJS authentication is done via strategies. We make use of two different strategies in our application:
- JWT: This is our default strategy and is being used for authentication with our end-users. 
- Integration: We have a strategy where and external system can interact with exposed endpoints via a given token. Technically this is possible, but we currently do not allow any external system to interact with our API. If we would want to, we will look into OAuth 2.0 for authentication with external systems, instead of a regular token.

Every strategy will add data to the request object to identify the authenticated user. The authenticated user can be retrieved via `request.auth.credentials`.

Learn more on authentication with Hapi via [this](https://hapijs.com/api/13.2.1#serverauthstrategyname-scheme-mode-options) link.

## Layers
We follow the following convention all the way from an incoming HTTP request, to the desired output. This sections explains the different layers in our application and what happens in each layer.  

Layers: HTTP Request -> Handler -> Service -> Repository

### Handler
The handler can also be seen as the controller. This is a really small function that dispatches the data to our service, which will handle the DB transaction and gather the data. An example of a handler:  

```
import * as responseUtil from '../../../shared/utils/response';
import * as messageService from '../services/message';

export default async (req, reply) => {
  try {
    const payload = { ...req.params };
    const message = { ...req.pre, ...req.auth };
    const output = await messageService.listComments(payload, message);

    return reply({ data: responseUtil.toSnakeCase(output) });
  } catch (err) {
    return reply(err);
  }
};
```

As you can see we also follow the convention of only passing `payload` and `message` to our service. This is a default signature that every service allows.

### Service
A service contains business logic to gather sets of data that are requested. Every service implements the same signature, which only has two parameters. The first is `payload` which contains an object of the data needed to succesfully get the data. The second is `message` which contains meta data that is bound to the request. Every message contains the following:

- artifacts.requestId - The ID attached to the request. This is so we are able to trace a specific error through our different layers.
- network - The network that belongs to the request. This set when the endpoint contains `{networkId}` as segment and the `prefetch` option in the route is set to `true`.
- credentials - The authenticated user

### Repository
The repository directly talks to our data layer. We make use of the ORM called Sequelize to access the database.

## Configuration
For configuration we use [dotenv](https://github.com/motdotla/dotenv) so we are able to have a `.env` file that writes variables into our NodeJS process.  
These configuration values can be retrieved via `process.env.MY_KEY`.

## Logging
We use a library called Bunyan to log request and error data through our application. Every error will get logged to `stdout`, because our process manager (PM2) will output the logs to a specific file that is configured with logrotate to compress the logfiles. 

Most of our logging is done in the service layer, where we always log incoming data.  
Example: `logger.info('My cool function is being called', { payload, message });`

At the top of each service we instantiate a logger instance with `const logger = Logger.getLogger('module/type/name');`.
Each logger instance has it's convention to start with the module name, followed by the type of file (service, repository, handler etc.) and their name. So a service called swag, inside an authorization module would be written as `AUTHORIZATION/service/swag`. This way we can easily identify the location of the log when we are inspecting them.

## Code Style/Guidelines
Through our application we make use of ES6. The syntax can be overwhelming at first when you're coming from ES5, but will pay of quite well. We also follow the style guide made by AirBnb. This can be found [here](https://github.com/airbnb/javascript). These guidelines are also implemented in our linter, that checks if the code doesn't violate AirBnb's style guide.  

If you want to check for lint errors you may use `npm run lint`.
