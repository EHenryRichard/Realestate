# Rust Learning Guide For This API

This file is for learning Rust by writing the Sureboy Realty API yourself.

The goal is not only to make the API work. The goal is to understand what every part means, why it is written that way, and how to think when you are writing Rust.

This project uses:

- Actix Web for HTTP routes and handlers.
- SQLx for normal PostgreSQL SQL.
- Serde for JSON input/output.
- Validator for checking request data.
- UUID and Chrono for ids and dates.
- No SeaORM. No ORM. We write parameterized SQL ourselves.

## 1. The Rust Mindset

When you write Rust, think in this order:

1. What data shape do I need?
2. Who owns the data?
3. Do I need to borrow the data or move it?
4. Can this operation fail?
5. If it can fail, what response should I return?
6. Is this operation async?
7. What exact type should this function return?

Rust feels strict because it wants you to be clear about data, errors, and ownership before the program runs.

In JavaScript you may write first and discover problems at runtime. In Rust you make the compiler your partner: if it compiles, many classes of bugs are already gone.

## 2. How This API Is Structured

The important folders are:

```text
api/src/main.rs
api/src/config.rs
api/src/db.rs
api/src/routes/
api/src/handlers/
api/src/dto/
api/src/models/
api/src/handlers/common.rs
```

Meaning:

- `main.rs`: starts the server.
- `config.rs`: reads environment variables.
- `db.rs`: connects to PostgreSQL and gives us a shared pool.
- `routes/`: says which URL calls which handler.q
- `handlers/`: contains the actual request logic.
- `dto/`: request body shapes. DTO means Data Transfer Object.
- `models/`: database row shapes.
- `handlers/common.rs`: helper functions for JSON responses.

The flow is:

```text
Browser/Postman
  -> route
  -> handler
  -> SQL query
  -> database
  -> model
  -> JSON response
```

Example:

```text
POST /api/newsletter
  -> newsletter_routes.rs
  -> subscribe_public()
  -> INSERT INTO newsletter_subscribers
  -> NewsletterSubscriber model
  -> common::created(...)
```

## 3. Important Rust Keywords

### `use`

`use` imports names so you do not write the full path every time.

```rust
use actix_web::{Responder, web};
```

This means:

- bring `Responder` into this file.
- bring `web` into this file.

Without it, you would need to write longer paths.

### `mod`

`mod` tells Rust that another module exists.

Example from `src/handlers/mod.rs`:

```rust
pub mod newsletter_handler;
```

This means Rust should include:

```text
src/handlers/newsletter_handler.rs
```

### `pub`

`pub` means public. Other modules can access it.

```rust
pub struct NewsletterRequest {
    pub email: String,
}
```

The struct is public, and the `email` field is public.

If a field is not public, other modules cannot read it directly.

### `struct`

A `struct` is a data shape.

```rust
pub struct NewsletterRequest {
    pub email: String,
}
```

This means a newsletter request must have one field called `email`.

### `impl`

`impl` means implementation. It is where you attach functions to a struct.

```rust
impl AppConfig {
    pub fn from_env() -> Self {
        // ...
    }
}
```

This means `AppConfig::from_env()` is a function that belongs to `AppConfig`.

### `fn`

`fn` creates a function.

```rust
fn subscriber_select() -> String {
    format!("SELECT {SUBSCRIBER_COLUMNS} FROM newsletter_subscribers")
}
```

This function returns a `String`.

### `async`

`async` means this function can wait for slow work without blocking the server.

Database queries are slow compared to CPU work, so handlers are usually async.

```rust
pub async fn list_admin(pool: web::Data<DbPool>) -> impl Responder {
    // ...
}
```

### `.await`

`.await` waits for an async operation to finish.

```rust
.fetch_all(pool.get_ref())
.await
```

Think of it as:

```text
Start database query.
Pause this handler.
Let the server handle other requests.
Continue when the database returns.
```

### `let`

`let` creates a variable.

```rust
let id = Uuid::new_v4();
```

Rust variables are immutable by default. That means you cannot change them unless you write `mut`.

### `mut`

`mut` means mutable.

```rust
let mut count = 0;
count = count + 1;
```

Use `mut` only when the value truly needs to change.

### `match`

`match` handles different possible outcomes.

```rust
match result {
    Ok(value) => common::ok("Success", value),
    Err(error) => common::server_error(error),
}
```

This is like a stronger `switch`, but Rust forces you to handle all cases.

### `Ok` and `Err`

Rust uses `Result` for operations that can fail.

```rust
Result<SuccessType, ErrorType>
```

It has two possibilities:

- `Ok(value)`: the operation worked.
- `Err(error)`: the operation failed.

Database queries return a `Result`.

### `Some` and `None`

Rust uses `Option` when a value may or may not exist.

```rust
Option<T>
```

It has two possibilities:

- `Some(value)`: there is a value.
- `None`: there is no value.

Example:

```rust
match query_result {
    Ok(Some(subscriber)) => common::ok("Found", subscriber),
    Ok(None) => common::not_found("Subscriber not found"),
    Err(error) => common::server_error(error),
}
```

### `&`

`&` means borrow.

```rust
db::connect(&config)
```

This gives `connect` permission to read `config` without taking ownership of it.

Borrowing is one of the most important Rust ideas.

### `clone`

`clone()` makes a new copy of a value.

```rust
config.clone()
```

Use it when a value needs to be shared and the type supports cloning.

In this API, `AppConfig` derives `Clone`, so Actix can give each worker access to the config.

### `::`

`::` accesses something inside a module, type, or namespace.

```rust
Uuid::new_v4()
AppConfig::from_env()
HttpResponse::Ok()
```

### `.`

`.` calls a method on a value.

```rust
payload.email.trim()
pool.get_ref()
result.rows_affected()
```

### `?`

`?` means: if this is an error, return the error immediately.

Example from `main.rs`:

```rust
.bind(bind_address)?
```

If binding the server fails, the function returns the error.

You can use `?` only when the current function returns a compatible `Result`.

### Raw strings: `r#"... "#`

Rust raw strings are useful for SQL.

```rust
let query = r#"
    SELECT id, email
    FROM newsletter_subscribers
"#;
```

They let you write multi-line strings without escaping many characters.

## 4. Ownership In Simple Words

Rust always asks:

```text
Who owns this value?
```

If a function takes ownership, the old owner cannot use it anymore.

```rust
fn takes_string(value: String) {
    println!("{}", value);
}

let name = String::from("Sureboy");
takes_string(name);
// name cannot be used here anymore
```

If a function borrows, the old owner keeps the value.

```rust
fn reads_string(value: &String) {
    println!("{}", value);
}

let name = String::from("Sureboy");
reads_string(&name);
// name can still be used here
```

In API code:

```rust
db::connect(&config)
```

We borrow `config` because `main` still needs it later.

## 5. The Difference Between DTOs And Models

DTOs are for request data.

Models are for database rows.

### DTO Example

```rust
#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct NewsletterRequest {
    #[validate(email)]
    pub email: String,
}
```

Meaning:

- `Debug`: lets Rust print the struct for debugging.
- `Deserialize`: lets Serde turn JSON into this struct.
- `Serialize`: lets Serde turn this struct into JSON.
- `Validate`: lets validator check fields.
- `rename_all = "camelCase"`: JSON uses camelCase names.
- `#[validate(email)]`: the field must be an email.

This JSON can become `NewsletterRequest`:

```json
{
  "email": "client@example.com"
}
```

### Model Example

```rust
#[derive(Debug, Clone, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct NewsletterSubscriber {
    pub id: Uuid,
    pub email: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

Meaning:

- This matches a row from `newsletter_subscribers`.
- `sqlx::FromRow` lets SQLx convert a database row into this struct.
- The field names must match the selected SQL columns.

If your SQL selects:

```sql
SELECT id, email, status, created_at, updated_at
FROM newsletter_subscribers
```

Then SQLx can fill `NewsletterSubscriber`.

## 6. Actix Web Basics

### Handler

A handler is a function that handles a request.

```rust
pub async fn list_admin(pool: web::Data<DbPool>) -> impl Responder {
    // ...
}
```

Meaning:

- `pub`: route files can access it.
- `async`: it waits for database work.
- `fn list_admin`: function name.
- `pool: web::Data<DbPool>`: Actix gives this handler the shared database pool.
- `-> impl Responder`: this function returns something Actix can send as an HTTP response.

### Extractors

Actix uses extractors to pull data out of the request.

Common extractors:

```rust
web::Data<DbPool>       // shared app data, like database pool
web::Json<MyDto>        // JSON request body
web::Path<String>       // URL path value
web::Query<MyDto>       // query string values
```

Example:

```rust
pub async fn update_status_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<NewsletterStatusRequest>,
) -> impl Responder {
    // ...
}
```

This handler receives:

- database pool
- an `id` from the URL
- JSON body with status

For this route:

```text
PATCH /api/admin/newsletter/abc-123/status
```

`path` contains `abc-123`.

The JSON body becomes `NewsletterStatusRequest`.

## 7. SQLx Basics

We use SQLx, but we still write normal SQL ourselves.

### `query`

Use `sqlx::query` when you do not need a full model back.

Example:

```rust
sqlx::query("DELETE FROM newsletter_subscribers WHERE id = $1")
    .bind(id)
    .execute(pool.get_ref())
    .await
```

This deletes a row.

### `query_as`

Use `sqlx::query_as::<_, ModelName>` when you want SQLx to return a model.

Example:

```rust
sqlx::query_as::<_, NewsletterSubscriber>(&query)
    .bind(id)
    .fetch_one(pool.get_ref())
    .await
```

This means:

```text
Run this SQL.
Convert the returned row into NewsletterSubscriber.
```

### `.bind(...)`

`.bind` safely passes values into SQL.

```rust
.bind(payload.email.trim())
```

Do this:

```rust
sqlx::query("SELECT * FROM users WHERE email = $1")
    .bind(email)
```

Do not do this:

```rust
format!("SELECT * FROM users WHERE email = '{}'", email)
```

The second style can create SQL injection bugs.

### `$1`, `$2`, `$3`

PostgreSQL parameters are numbered.

```sql
WHERE id = $1 AND status = $2
```

Then bind in the same order:

```rust
.bind(id)
.bind(status)
```

### `fetch_one`

Use when the database must return exactly one row.

```rust
.fetch_one(pool.get_ref()).await
```

If no row is found, this becomes an error.

### `fetch_optional`

Use when the row may not exist.

```rust
.fetch_optional(pool.get_ref()).await
```

It returns:

```rust
Ok(Some(row))
Ok(None)
Err(error)
```

This is good for `GET /:id`, `UPDATE /:id`, and `DELETE /:id` style logic.

### `fetch_all`

Use when you expect a list.

```rust
.fetch_all(pool.get_ref()).await
```

It returns:

```rust
Ok(Vec<ModelName>)
Err(error)
```

### `execute`

Use when you only care that SQL ran.

```rust
.execute(pool.get_ref()).await
```

It returns a result object. You can check:

```rust
result.rows_affected()
```

## 8. Reading The Newsletter Handler

This file is a good learning file:

```text
api/src/handlers/newsletter_handler.rs
```

### Imports

```rust
use actix_web::{Responder, web};
use serde_json::json;
use uuid::Uuid;
```

Meaning:

- `Responder`: lets a handler return an HTTP response.
- `web`: Actix tools like `web::Data`, `web::Json`, `web::Path`.
- `json`: creates JSON values.
- `Uuid`: creates and parses UUID ids.

Then:

```rust
use crate::{
    db::DbPool,
    dto::newsletter_dto::{NewsletterRequest, NewsletterStatusRequest},
    handlers::common,
    models::newsletter_subscriber::NewsletterSubscriber,
};
```

`crate` means the root of this Rust project.

This imports:

- the database pool type
- request DTOs
- common response helpers
- the newsletter database model

### Column Constant

```rust
const SUBSCRIBER_COLUMNS: &str = r#"
    id,
    email,
    status,
    created_at,
    updated_at
"#;
```

This avoids repeating the same column list in every query.

`&str` means string slice. It is borrowed string data.

### Helper Function

```rust
fn subscriber_select() -> String {
    format!("SELECT {SUBSCRIBER_COLUMNS} FROM newsletter_subscribers")
}
```

This creates:

```sql
SELECT id, email, status, created_at, updated_at
FROM newsletter_subscribers
```

It returns a `String` because `format!` creates an owned string.

### Parse Id

```rust
fn parse_id(path: web::Path<String>) -> Result<Uuid, actix_web::HttpResponse> {
    Uuid::parse_str(&path.into_inner()).map_err(|_| common::bad_request("Invalid subscriber id"))
}
```

Meaning:

- Input: a path value from Actix.
- Output: either a valid `Uuid` or an HTTP error response.

`path.into_inner()` takes the actual string out of the Actix wrapper.

`Uuid::parse_str(...)` tries to turn the string into a UUID.

`map_err(...)` changes the error into our own bad request response.

### Create Newsletter Subscriber

```rust
pub async fn subscribe_public(
    pool: web::Data<DbPool>,
    payload: web::Json<NewsletterRequest>,
) -> impl Responder {
```

This handler receives:

- database pool
- JSON body

Then:

```rust
let id = Uuid::new_v4();
```

We create a new id in Rust before inserting.

Then:

```rust
let query = format!(
    r#"
    INSERT INTO newsletter_subscribers (id, email, status)
    VALUES ($1, $2, 'active')
    RETURNING {SUBSCRIBER_COLUMNS}
    "#
);
```

This creates SQL.

Important:

- `$1` is the id.
- `$2` is the email.
- `'active'` is hardcoded in SQL.
- `RETURNING` gives us the inserted row back.

Then:

```rust
match sqlx::query_as::<_, NewsletterSubscriber>(&query)
    .bind(id)
    .bind(payload.email.trim())
    .fetch_one(pool.get_ref())
    .await
{
    Ok(subscriber) => common::created("Newsletter subscription successful", subscriber),
    Err(error) => common::server_error(error),
}
```

Read it like this:

```text
Run SQL.
Bind id as $1.
Bind trimmed email as $2.
Fetch one row.
Wait for database.
If it works, return 201.
If it fails, return 500.
```

## 9. How To Write A New Handler Yourself

Use this thinking structure every time.

### Step 1: Decide the route

Example:

```text
GET /api/admin/services
```

### Step 2: Decide the handler name

Example:

```rust
pub async fn list_admin(pool: web::Data<DbPool>) -> impl Responder
```

### Step 3: Decide the database model

Example:

```rust
Service
```

### Step 4: Write the SQL

Example:

```sql
SELECT id, title, slug, summary, description, icon, features, is_active, sort_order, created_at, updated_at
FROM services
ORDER BY sort_order ASC, created_at DESC
```

### Step 5: Choose SQLx method

Use:

- `fetch_all` for list.
- `fetch_one` for create where `RETURNING` must return a row.
- `fetch_optional` for maybe-found records.
- `execute` for delete or commands with no model needed.

### Step 6: Match the result

Example:

```rust
match sqlx::query_as::<_, Service>(&query)
    .fetch_all(pool.get_ref())
    .await
{
    Ok(services) => common::ok("Services fetched successfully", services),
    Err(error) => common::server_error(error),
}
```

### Step 7: Add the route

In the route file:

```rust
cfg.route("/services", web::get().to(service_handler::list_admin));
```

### Step 8: Test it

Run:

```bash
cargo check
```

Then run the server and test the endpoint.

## 10. Common Patterns In This API

### List

```rust
pub async fn list_admin(pool: web::Data<DbPool>) -> impl Responder {
    let query = "SELECT ... FROM table_name ORDER BY created_at DESC";

    match sqlx::query_as::<_, ModelName>(query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(items) => common::ok("Items fetched successfully", items),
        Err(error) => common::server_error(error),
    }
}
```

### Create

```rust
pub async fn create_admin(
    pool: web::Data<DbPool>,
    payload: web::Json<CreateRequest>,
) -> impl Responder {
    let id = Uuid::new_v4();
    let query = "INSERT INTO table_name (...) VALUES (...) RETURNING ...";

    match sqlx::query_as::<_, ModelName>(query)
        .bind(id)
        .bind(payload.name.trim())
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(item) => common::created("Item created successfully", item),
        Err(error) => common::server_error(error),
    }
}
```

### Update

```rust
pub async fn update_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<UpdateRequest>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    let query = "UPDATE table_name SET name = $2, updated_at = now() WHERE id = $1 RETURNING ...";

    match sqlx::query_as::<_, ModelName>(query)
        .bind(id)
        .bind(payload.name.trim())
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(item)) => common::ok("Item updated successfully", item),
        Ok(None) => common::not_found("Item not found"),
        Err(error) => common::server_error(error),
    }
}
```

### Delete

```rust
pub async fn delete_admin(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    match sqlx::query("DELETE FROM table_name WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => common::ok("Item deleted successfully", json!({ "id": id })),
        Ok(_) => common::not_found("Item not found"),
        Err(error) => common::server_error(error),
    }
}
```

## 11. How To Read Compiler Errors

Do not panic when Rust shows a long error.

Read it in this order:

1. The first file path and line number.
2. The expected type.
3. The found type.
4. The help message.

Common examples:

### Expected `String`, found `&str`

Fix by converting:

```rust
value.to_string()
```

### Value moved

Rust is saying one function took ownership and you tried to use the value again.

Fix options:

- Borrow with `&value`.
- Clone with `value.clone()`.
- Reorder the code.

### Missing trait

If SQLx says a model does not implement `FromRow`, add:

```rust
#[derive(sqlx::FromRow)]
```

### Cannot serialize

If Actix cannot return a model as JSON, add:

```rust
#[derive(Serialize)]
```

## 12. How To Think About Errors

Every fallible operation should have a clear response.

Database query can fail:

```rust
Err(error) => common::server_error(error)
```

Record may not exist:

```rust
Ok(None) => common::not_found("Item not found")
```

User may send invalid id:

```rust
Err(response) => return response
```

User may send invalid body:

Use DTO validation before inserting or updating.

## 13. The No ORM Rule

This project does not use SeaORM.

Use this:

```rust
sqlx::query_as::<_, Property>(&query)
    .bind(value)
    .fetch_all(pool.get_ref())
    .await
```

Do not use:

```rust
PropertyEntity::find()
ActiveModel
DatabaseConnection
EntityTrait
```

The reason is learning and control. Writing SQL yourself helps you understand:

- what table is being queried
- what columns are selected
- what values are bound
- what comes back from PostgreSQL

## 14. Mini Exercises For You

Do these slowly.

### Exercise 1

Open:

```text
api/src/handlers/newsletter_handler.rs
```

Explain out loud what `subscribe_public` does line by line.

### Exercise 2

Write a fake SQL query on paper:

```sql
SELECT ...
FROM ...
WHERE ...
ORDER BY ...
```

Then turn it into a SQLx handler.

### Exercise 3

Create a small DTO with two fields:

```rust
pub struct ExampleRequest {
    pub title: String,
    pub description: String,
}
```

Add `Deserialize`, `Serialize`, and `Validate`.

### Exercise 4

Look at one handler and identify:

- the request data
- the database query
- the success response
- the error response

## 15. Daily Learning Routine

For each Rust API feature:

1. Write the route first.
2. Write the DTO.
3. Write the model or check the model already exists.
4. Write the handler function signature.
5. Write the SQL.
6. Bind values.
7. Match the result.
8. Run `cargo check`.
9. Fix compiler errors one by one.
10. Test the endpoint.

Do not rush. Rust rewards slow, clear thinking.

## 16. Your Main Rule

When writing Rust, always ask:

```text
What type is this?
Who owns it?
Can it fail?
What do I return?
```

If you can answer those four questions, you can write the code.

