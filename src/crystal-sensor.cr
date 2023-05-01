require "kemal"

require "./container"
require "./db"

port = ENV["WEB_PORT"].to_i

db = Container.resolve(Database)

title = "Temps"

get "/" do
  current_readings = db.current_readings()
  render "src/templates/current.ecr", "src/templates/layout.ecr"
end

get "/graph" do
  render "src/templates/graph.ecr", "src/templates/layout.ecr"
end

get "/api/graph" do |env|
  env.response.content_type = "application/json"
  timespan = env.params.query["last"]
  graph_data = db.graph_data(timespan)
  graph_data.to_json
end

Kemal.run(port)
