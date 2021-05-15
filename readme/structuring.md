# Structuring the operations in Uaithne <!-- omit in toc -->

This page show you how you can structure the operations in your application using Uaithne. This reccomendations may apply or not to your projec, take it as inspiration for your design.

# Summary <!-- omit in toc -->

- [Typical operations of access to the database](#typical-operations-of-access-to-the-database)
- [Calls to stored procedures](#calls-to-stored-procedures)
- [Modeling the data](#modeling-the-data)
  - [Entity views](#entity-views)
  - [Object-oriented modeling of data](#object-oriented-modeling-of-data)
  - [Grouping results](#grouping-results)
  - [Primary key](#primary-key)
- [Execution permissions](#execution-permissions)
- [Optional fields in operations](#optional-fields-in-operations)
- [Data validation](#data-validation)
- [Ordering](#ordering)
- [Implementation of access to the database](#implementation-of-access-to-the-database)
- [Accesing to the backend](#accesing-to-the-backend)
  - [Exposing the execution bus as a JSON-based RPC sercice](#exposing-the-execution-bus-as-a-json-based-rpc-sercice)
- [Other elements](#other-elements)
  - [Distributed transactions](#distributed-transactions)
  - [Aspect-oriented programming](#aspect-oriented-programming)
  - [Dependency injection](#dependency-injection)
  - [Unit tests](#unit-tests)

## Typical operations of access to the database

Any action that can be performed on a system can be expressed as an operation, but when interacting with the database, a series of common operations arise, which although changing its parameters, are repeated as a pattern:

**Query operations**:

- **SelectOne**​: This operation returns the entity whose fields match the criteria indicated in the operation. A variant of this type of operation is one that returns only the entity that represents the first record found.

- **SelectMany**​ :This operation returns a list of entities whose fields match the criteria indicated in the operation. A variant of this type of operation is one in which only the different registers are brought back, using the ​distinct​ clause in the SQL query.
  
- **SelectPage**​: This operation returns a list of entities as a page's view whose fields match the criteria indicated in the operation. A variant of this type of operation is one in which only the different registers are brought back, using the ​distinct​ clause in the SQL query.
  
  Select Page operations are the most complex query operations, and at the same time quite useful when building the interface, so its consideration from the beginning is highly recommended.
  
  Select Page operations must receive at least the following values:

  - **limit**​: indicates the number of records to be obtained in a data page, that is, it is the maximum size of the page. If this field is null/undefined, it indicates that it has no limit, so the maximum number of possible records must be brought back.
  
  - **offset**​: indicates the number of records to be ignored prior to the data page that you wish to consult. The offset can be considered as the index (including if you consider that the indexes begins in zero) from which you will bring records. ​**Example**​: If you have the size of the page as 20 records, and you want to obtain the third page, the value of this field should be (3 - 1) * 20, which is 40 records before being ignored, since you will get the records 41 to 60 (if you consider that the indexes start at one). If this field is null/undefined, it indicates that no record will be ignored.

  The result of the operation must be an object that contains the following values:

  - **limit**​: contains the ​limit ​used in the operation that returned this object and represents the maximum size of the page.
  - **offset**​: contains the​ offset ​used in the operation that returned this object and represents the number of previous records that have been ignored.
  - **dataCount**​: contains the total number of records; if the operation specified one value, the value of this field is the one indicated in the operation; but, if not, the value is the count of the total number of existing records without paging.
  - **data**​: contains the list of the records that belong to the requested page.

  When implementing a Select Page operation, it is normal to have to perform two queries to the database, one to bring back the records of the data page consulted and the other to get the number of existing records.

  It is usually useful, to give the possibility to consult the existing number of records without consulting a data page or to allow a way of not having to recount the number of existing records; for this you can add the following properties to the operation:

  - **dataCount**​: indicates the total number of records. If you specify the value of this field in the operation, it causes that the operation not to have to consult the total number of records, instead it is assumed that the value is the one indicated here, and this is useful to avoid the additional query that counts the records.
  - **onlyDataCount**​: if ​true ​is specified in this field it causes the operation to only check the total amount of the record, without bringing the data of any of the pages (te returning data is an empty list).

- **SelectCount**​: This operation returns the number of entities whose fields match the criteria indicated in the operation. A variant of this type of operation is one in which only the different registers are brought back, using the ​distinct​ clause in the SQL query.

- **SelectEntityById**​: This operation returns the entity whose id is the one indicated in the operation. A variant of this type of operation is one that returns only the entity that represents the first record found.

**Entity modification operations**:

- **InsertEntity**​: This operation inserts a record with the values indicated in the entity contained by the operation. The operation returns as result, if desired and possible, the id of the inserted record. This behaviour is recommended, even though it is not used since it allows the operation to be reused in more places or to follow up on the logs.

- **UpdateEntity**​: This operation updates a record with the values indicated in the entity contained by the operation; the record to be updated is the one that matches the id indicated in the entity.

- **DeleteEntityById**​: This operation deletes a record whose id is the one indicated in the operation.
  
- **SaveEntity**​: This operation inserts or updates a record with the values indicated in the entity contained by the operation; the record to be updated is the one that matches the id indicated in the entity, if it is not inserted. The operation returns as result, if desired and possible, the id of the inserted record. This behaviour is recommended, even though it is not used since it allows the operation to be reused in more places or to follow up on the logs.

- **MergeEntity**​: This operation updates a record with the values indicated in the entity contained by the operation whose values are different of null; the record to be updated is the one that matches the id indicated in the entity.

**Data modification operations not restricted to entities**:

- **Insert**​: This operation inserts a record with the values indicated in the operation. The operation returns as result, if desired and possible, the id of the inserted record. This behavior is recommended, even though it is not used since it allows the operation to be reused in more places or to follow up on the logs.

- **Update**​: This operation updates a record with the values indicated in the operation. It must be kept into consideration that in this type of operation, the fields of the operation can be used as part of the ​where​ of the query, or as values to be updated in the database, and in some cases, if desired, be omitted if the supplied value is null/undefined, thus leaving the current value in the database unchanged.

- **Delete**​: This operation eliminates the records with the values indicated by the operation, whose criteria is defined in the implementation of this operation.

It should be noted that the operations indicated here are usually typical of database, but it is always possible to create more operations that escape this typology. This often happens in the backend of the application, where an operation could be "Send notice of collection". ​**The important thing is that the operation always maintains its meaning**​, so it would be incorrect to use an invoice insertion operation in the invoice table of the database (of the module that represents the invoice table) as invoice issuance operation. This should be a different operation that should be in the billing module located in the backend layer.

**Tip**: You can extends `OperationType` to create an operation type class for each type described here to make easier interact with these operation in a more general way. As well you can add more information to the operation type like the definition required to validate the data.

## Calls to stored procedures

Calls to stored procedures in the database can be expressed as an operation, preferably according to one of the typical types of operations discussed above, taking into account that any output that has the procedure must be returned as part of the result of the operation and never modifying the object of the operation itself. This is of special attention in the procedures with input and output parameters, where the input must be read from the operation, but the output must be written to the result (never in the operation or in the context).

In the invocation of stored procedures, as in any other action, the result of the execution must always be read from the object resulting from the operation execution. In the operation or in the context, under no circumstances, the result of the execution or any intermediate state should be stored.

## Modeling the data 

### Entity views

In many circumstances, when consulting the database, you don’t want to extract an entire record, instead you want to extract some of that information, or even that information can be combined with information from another table; in those cases an entity can be created that only contains the desired information. This type of entity will be called an "entity view" and its construction is identical to that of an entity with the difference that it does not represent an entire record stored in a table.

### Object-oriented modeling of data

The data of the database must be modeled in objects as they are in their origin, and in no case should transformations be applied to try to build an object-oriented adaptation.

This point especially affects the handling of relationships. The relationships in the database must be represented in the same way they are there; for example, if a record has the identifier of another record, when creating the entity that represents it, this must be maintained as is, the id of the other record will be included instead of having a reference to another object (or in other cases having a reference to a collection of objects).

The objective is that the entities represent the data as they are in the database, without making any tricks that alter the existing relational modeling.

### Grouping results

If you want to perform an operation that returns several results, for example, a record of the database and its relationships, you must create an entity that will contain each of the records consulted in the database, so that they do not suffer alteration with respect to the query made to the database.

### Primary key

The use of primary keys composed of a single field is recommended, whenever possible (it is not worth to artificially create a primary key of a single field), since this greatly facilitates its use in the upper layers, especially in the construction of the Interface.

The use of composed keys is usually very useful in the database, and these can be of two natures:

- **All the members of the primary key are also foreign keys​**: in this case there is no other option than to handle all the members of the primary key in the operations. This situation is typical in the tables that control a relation many to many, where the table does not represent any concept in itself. Trying to create a unique identifier here does not make sense. In addition, it would only add complexity to the project, especially in the interface, so the use of these artificial primary keys is discouraged. But, an alternative key composed of one field can be useful under some circunstances, this alternative key can be used in some place as a replacement for the primary key.

- **Some member of the primary key is unique to the table**​: this is the case in which one or several foreign keys are part of the primary key, and additionally a field that is specific to the table (it is not foreign). In this case, it is recommended to try to convert this field into an alternate key (marking it as unique in the database) and using it outside the database as if it were the primary key of the table. If it is not possible to convert this field into an alternate key, there is no other option than to handle all the members of the primary key in the operations, as explained in the previous point.

  **An example**​ of this situation ​**is the invoice line table​, ​the primary key​** of this table is usually **​the identifier of the invoice**​, which is the foreign key of the invoice table, **and an identifier of the invoice line**​. To generate the identifier of the line of the invoice there are usually two options:

  - **The identifier of the line of the invoice is unique in the table**​: and can be generated by a self-incremental field or a sequence, which is the desired situation since this field can be converted into an alternate key (marking it as unique in the database) and treat it as the primary key in the application.
  - **The invoice line identifier is unique within the invoice**​: this value may be, for example, the number of the line in the invoice. These type of values are usually complex to manage, especially in the interface, and require a complex logic to be generated or maintained; for example, if an intermediate line is eliminated, so its use is discouraged, the desirable thing here would be to be able to transform this situation to the one exposed in the previous point, where the identifier of the line of the invoice is unique in the table. If not possible, there is no other option than to handle inside the operations all the members of the primary key and add the logic for the creation and maintenance of this identifier.

When creating operations, it is recommended to have preference for the keys composed of a single field on which they are composed of more than one field, without this being translated in trying to avoid the use of compound keys in the database, which are usually great utility, or the creation of artificial identifiers in some tables. The primary key used in the operations does not necessarily have to be the primary key of the database, an alternate key can perfectly identify the record unequivocally.

## Execution permissions

The management of the security of the application is done by controlling the operations that the user can execute, without evaluating in any case the content of the operation. To achieve this, it may be necessary, in some cases, to have the same operation duplicated, one contextualized or another more general, or one that admits a series of parameters and others that additionally admit some more.

The definition of the operation must be consistent with the permits required, which must be invariable according to the content of the operation; if the required permits vary depending on the content, this operation must be divided until each operation has its own permits without depending on the content, even if that means having similar operations.

You can define an interceptor placed in one of the outermost layer of the execution bus that verify if the user can execute the requested operation; if not, an exception can be thrown.

## Optional fields in operations

The use of optional fields in the operations, that is, fields that support nulls/undefined, is a great help, and avoid having to create many operations that do the same, supersets of the previous one, where the next version allows adding one more field with respect to the previous one. The optional fields are used, for example, to have a operation that query to the database, which allows to have more demanding filtering criteria to the extent that the value is specified to those fields, that is, if the field has a value, the condition must be included in the ​where clause of the query.

The use of optional fields in the operations must be clearly indicated in its definition, by means of an attribute (of having automatic validations) or a comment, in such a way that the person who sees the definition of the operation can easily know which fields are optional without having to search the implementation. In TypeScript optional fields can be marked in the type definition and only alllows undefined as value.

The use of optional fields must respect the meaning of the action to be performed by the operation, so it is incorrect to have the same operation whose nature changes depending on the presence or absence of a value.

If you use optional fields whose impact goes beyond the conditions of the ​where​ clause of the query, you have to evaluate its impact in terms of security. The permission of the application is based on the operations that can be executed by a user. The content of an operation must not be valued or questioned; so, if the presence of an optional field causes the operation to have two different permit levels (depending on the presence or absence of the value), it is highly advisable to divide the operation into two, in such a way that the principle that the execution permits of the operation do not depend on its content is respected.

## Data validation

The use of a validation library is recommended, which allows, through the use of an external definition object (preferably), to validate the data, in such a way that the rules expressed there contain all the restrictions, as far as the data refer, that exist in the database.

The idea with this type of libraries is to complement the definition of the type, by using a definition, which add restrictions to the fields; for example, in a property of type ​int​, you can specify the range of valid values, or the length maximum of a string.

This type of framework usually allows to indicate the following type of validations:

- Mandatory or optional field, allowing or not allowing null values
- Range of valid values in a number
- Minimum and maximum length of a string
- Validate string using regular expressions, for example, to validate an email or a URL
- Validate a date be from the past
- Validate a date be from the future
- And more...

Some libraries to perform the validation in JavaScript/TypeScript are:

- [joi](https://joi.dev)
- [yup](https://github.com/jquense/yup)
- [superstruct](https://docs.superstructjs.org)
- [zod](https://github.com/colinhacks/zod)

The use of a validation framework is highly recommended, especially if its capacity is combined with the interface, so that you can take advantage of this information without having to manually program the validation.

By using a validation library, it is possible to write an interceptor that validates all the operations that come from the interface on the server, in such a way that it ensures that all operations received by the interceptor meet the criteria before performing any other action.

**Tip**: You can extends `OperationType` to create operations families where you can add more information like the definition required to validate the data.

## Ordering

Sometimes it is useful to have operations that receive the ​`order by`​ to be used in the query; for this you can use a ​string​ field that receives the ordering criterion.

**The sort criterion is nothing more than a string that contains**:
- Name of the field for which you are going to order.
- Optionally it can have the ​`order by`​ direction, to be: ​`asc`​ or `​desc`​.
- This can be repeated as many times as you want, separating it with a comma.

**Example**:
- `title`
- `title asc`
- `title asc, description`
- `title asc, description desc`

It is not recommended that the content of this field be passed directly to the database, but must be previously transformed and translated into the code.

**Rules that must be taken into account in the ordering criteria**:
- The name of the field must match the name of the property in the resulting entity, so that the value indicated here doesn’t depend on the construction of the query. The idea here is that the invoker of the operation doesn’t have to know the structure of the database or how the query is built.
- There is a known list with valid fields to order. If anything that does not comply with the format or an unknown field is included, an error must be raised, thus preventing the execution of the query. The idea here is to prevent any risk of SQL injection in this SQL fragment.

**To translate ordering rule, you must**:
- Normalize the upper and lower case, being able, for example, transforming everything to lowercase.
- Replace any occurrence of several blank spaces with one.
- Separate by commas, taking into account that, optionally, the comma may contain blank spaces before and after.
- Remove any blank space that is at the beginning or end of the fragment.
- For each resulting element, look for its translation to its equivalent in the database, bearing in mind that it has three variants:
  - `field_name` ​​which translates to `​column_name`
  - `field_name ​asc` ​which translates to `​column_name ​asc`
  - `field_name​ desc` ​which translates to ​`column_name ​desc`
  - If it is not contained in any of these three variants, an exception is thrown, thus denying the execution of the operation.
- Once all the terms are translated into their database equivalent, they are put together in a single ​string​ separated by a comma.
- The resulting ​string​ is the one that can be used in the query.

**The fact that the operation receives the order clause in this way allows**:
- to make changes in the query without having to modify the code of the invocantes of the operation.
- to protect yourself from SQL injections, since typically this part of the query is not passed as a parameter of the database, but it is concatenated to the query itself.
- to facilitate the use of the operation, since the invoker doesn’t have to know how the query is constructed, it only knows the name of the fields resulting from the operation, and with that can build the `​order by`​ clause.
- to maintain the database logic within the database access layer, since in this way the query is not seen scattered along multiple layers.

The fact that the operation doesn’t receive the ​string​ to be used directly in the query is highly recommended. It is strongly discouraged to receive in this string the ​`order by`​ clause as required by the database.

## Implementation of access to the database

To implement access to the database there is no special requirement, so you can use any framework that you want. However, it is recommended to model the data as it is at its origin, and to avoid any attempt to transform the data in the database into an object-oriented model.

The benefits of modeling the database information in an object-oriented model are usually few when dealing with services that serialize the data by, for example, the service that sends the data to the web application, but the additional complications are many, such as managing the discrepancy between the two worlds, controlling the deferred loads of the data and its handling during serialization (typically ORM libraries in JavaScript doesn't deal with this), more complex operations, data redundancy, etc. For these reasons and more, it is recommended not to try to model the database with an object-oriented model unless you have a good reason for that.

Some libraries in JavaScript offer a hybrid approach, a some kind of ORM management withot be a full ORM (like [Prisma](https://www.prisma.io)); in some circunstances these king of libraries can be useful.

You can use any database access framework that you want, but to make an appropriate selection it is necessary to understand the kind of life the database has in relation to the project:

- **Database-centered design**​: If you have an application whose data design is centered in the database, in which it is feasible to modify the database every time the application requires it, it is most appropriate to use a framework that allows access to the database as it is, and allows to validate the queries made in the application during the compilation. Some libraries in this category are:
  - **[Prisma](https://www.prisma.io)**: Some kind of ORM library (without be a full ORM) that allows to access the database. The result returned by this library looks more like an object composition with the relations included in a list as property of the returned object.
  - **[ts-sql-query](https://github.com/juanluispaz/ts-sql-query)**: Library that allows you to write SQL queries that are validated by the TypeScript compiler. The result returned by this library looks more like what the database returns, a plain object with properties. You have the possibility of combined with other one (like Prima) for use it in more complex situations, if you want.

- **Discrepancies between the database and the system**​: If it is necessary to tolerate discrepancies between the database and the application; for example, when the design of the database is not well done, the database is difficult to change, etc.; it is best to use a technic that separates both worlds, which allows queries to be represented in string (we must be careful with SQL injection attacks). Some posibilities that can be used in this situation are:
  - **[ts-sql-query](https://github.com/juanluispaz/ts-sql-query)**: Library that allows you to write SQL queries that are validated by the TypeScript compiler. The result returned by this library looks more like what the database returns, a plain object with properties.
  - **Raw SQL queries**: You can query directly the database using SQL; but, be careful about SQL injections.

## Accesing to the backend

You usually want your backend be accesible by external applications, like the user interface. For implement this you have several approach:
- REST service
- GraphQL service
- JSON-based RPC

### Exposing the execution bus as a JSON-based RPC sercice

One posibility that can make easier in some circunstances comunicate the backend and the frontend is using a RPC service. You can expose the execution bus directly to the interface using a RPC-like endpoint. This approach can speed up the development of the application when the frondend and the backend is considered part of the same development project, where, any change can be performed in the frontend and in the backend at the same time.

The idea is you expose an endpoint of you application with an url like:

```
https://www.example.com/rpc/:oprationName
```

And the web application make AJAX communication using a POST method, in the playload travel the JSON of the data required to execute the operation.

The code to create this RPC service coluld looks like:

```ts
const bus = createBus();

const app = express();
app.use(express.json()); // for parsing application/json

app.post('/rpc/:oprationName', function(req, res) {
    const oprationName = req.params.oprationName;
    const operationType = getImplementedOperationByName(bus.serviceBus, oprationName);
    if (operationType) {
        const operation = req.body; // JSON parsed by the json middleware
        const context = getContext(req);
        operationType.execute(operation, context, bus.serviceBus).then(result => {
            res.set('Cache-Control', 'no-store');
            res.json(result); // // JSON formated by the json middleware
        }).catch((error: unknown) => {
            if (error instanceof InsufficientPrivilegesError) {
                res.status(401); // Login needed
                // It could be also: res.status(419); // Session expired
            } else if (error instanceof ValidationError) {
                res.status(412); // Precondition Failed
            } else {
                res.status(500);
            }
        });
    } else {
        res.status(400);
    }
});

function getContext(req: express.Request) {
    // ...
}

function createBus() {
    // ...
}
```

Your `createBus` function could looks like:

```ts
function createBus() {
    const databasePool = createDatebasePool();

    const databaseLayer = ​combineExecutors(
        createCalendarsDatabaseModule(),
        createEventsDatabaseModule(),
        createEncryptPasswordInterceptorModule(createUsersDatabaseModule()),
        // ...
    );

    const backendLayer = ​combineExecutors(
        databaseLayer,
        createAuthenticationModule(databaseLayer),
        // ...
    );

    const frontendLayer = ​combineExecutors(
        backendLayer,
        createGroupedOperationsModule(backendLayer),
        // ...
    );

    const sqlSessionInterceptor = createSqlSessionInterceptor(frontendLayer);
    
    const internalBus = createLogDebugInterceptor(sqlSessionInterceptor);

    const permissionLayer = createPermissionInterceptor(validationLayer);
    const validationLayer = createValidatorInterceptor(permissionLayer);
    const serviceBus = createLogDebugInterceptor(validationLayer);

    return { internalBus, serviceBus };
}
```
**Special interceptors**:
- `ValidatorInterceptor`: that validate the incomming data have the required information and format.
- `PermissionInterceptor` that validates if the user can perform the operation. 

  **Tip**: You can extends `OperationType` to create your own class that store the infomation about how validate the incomming data (like the Joi Schema) and the permissions required to execute the operation.

**Errors**:
- `ValidationError`: This an error that extends from `PublicError` and it is thrown by the `ValidatorInterceptor` when the provided data doesn't fulfill the requirements.
- `InsufficientPrivilegesError`: This an error that extends from `PublicError` and it is thrown by the `PermissionInterceptor` when the user have no enought privileges to perform the operation.

## Other elements 

### Distributed transactions

The use of distributed transactions is seriously discouraged; its use must be completely justified and there must be no other alternative to achieve the same result.

The use of distributed transactions causes serious performance problems in the database, and in many cases it is convenient to tolerate the risk of a certain degree of inconsistency and manually handle special situations.

### Aspect-oriented programming

Through the use of interceptors, all the capabilities of aspect-oriented programming can be obtained in a simple way. All patterns for weaving the execution bus correspond to patterns of aspect-oriented programming.

### Dependency injection

The usage of the inversion of control pattern and dependency injection is usually very attractive and convenient. Taking into account the design proposed here, the use of this type of patterns is not required in the implementation of the executors or operations, since the most critical elements, typically the user's identity, permissions and connection of the database, are already managed by using the execution context; additionally, the separation of layers is guaranteed by the design itself.

The execution context usually contains the elements that are usually delegated to the dependency injection, so when the context object it created, it must be properly initialized. The other elements missing from the context usually are configuration of the module; this elements can be parameters of the initialization function of the module.

### Unit tests

Modeling the application of the form proposed here implies that the programmed code is very friendly to the unit tests, without requiring additional complications.

How to do unit tests of the connection to the database will depend on the database library that is chosen.