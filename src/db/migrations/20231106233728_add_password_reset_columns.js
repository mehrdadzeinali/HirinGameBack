exports.up = function(knex) {
    return knex.schema.table('users', function(table) {
      table.string('password_reset_code', 6).nullable();
      table.datetime('password_reset_code_expiry').nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
      table.dropColumn('password_reset_code');
      table.dropColumn('password_reset_code_expiry');
    });
  };
