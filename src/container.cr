require "hardwire"
require "./db"

module Container
  include HardWire::Container

  singleton Database do
    url = ENV["DB_URL"]
    Database.new(url)
  end
end
