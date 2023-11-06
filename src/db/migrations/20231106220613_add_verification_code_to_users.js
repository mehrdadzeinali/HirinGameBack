exports.up = function(knex) {
    return knex.schema.table('users', function(table) {
      table.string('verification_code', 6).nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
      table.dropColumn('verification_code');
    });
  };
