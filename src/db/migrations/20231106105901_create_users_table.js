exports.up = function(knex) {
    return knex.schema.createTable('users', table => {
      table.increments('id').primary();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.boolean('email_verified').defaultTo(false);
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('users');
  };
