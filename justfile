start-scylla:
    podman run --name scylla-sensor-dev --hostname scylla-sensor-dev -d docker.io/scylladb/scylla --smp 1

stop-scylla:
    podman stop scylla-sensor-dev

cqlsh:
    podman exec -it rust-sensor_scylla_1 cqlsh

migrate-up:
    migrate -path migrate -database cassandra://localhost:9042/sensor_dev?x-multi-statement=true up
