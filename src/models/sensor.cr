require "db"
require "json"

class Sensor
  include JSON::Serializable

  DB.mapping({
    id: Int64,
    name: String,
    description: String,
  })
end
