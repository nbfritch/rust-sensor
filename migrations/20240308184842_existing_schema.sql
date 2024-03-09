-- Add migration script here
--
-- PostgreSQL database dump
--

-- Dumped from database version 15.6
-- Dumped by pg_dump version 15.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: readings; Type: TABLE; Schema: public; Owner: nathan
--

CREATE TABLE public.readings (
    id bigint NOT NULL,
    temperature double precision,
    reading_date timestamp(0) without time zone DEFAULT timezone('utc'::text, CURRENT_TIMESTAMP),
    sensor_id bigint,
    inserted_at timestamp(0) without time zone DEFAULT timezone('utc'::text, CURRENT_TIMESTAMP) NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT timezone('utc'::text, CURRENT_TIMESTAMP) NOT NULL
);


ALTER TABLE public.readings OWNER TO nathan;

--
-- Name: readings_id_seq; Type: SEQUENCE; Schema: public; Owner: nathan
--

CREATE SEQUENCE public.readings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.readings_id_seq OWNER TO nathan;

--
-- Name: readings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nathan
--

ALTER SEQUENCE public.readings_id_seq OWNED BY public.readings.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: nathan
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE public.schema_migrations OWNER TO nathan;

--
-- Name: sensors; Type: TABLE; Schema: public; Owner: nathan
--

CREATE TABLE public.sensors (
    id bigint NOT NULL,
    name character varying(255),
    description character varying(255),
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


ALTER TABLE public.sensors OWNER TO nathan;

--
-- Name: sensors_id_seq; Type: SEQUENCE; Schema: public; Owner: nathan
--

CREATE SEQUENCE public.sensors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sensors_id_seq OWNER TO nathan;

--
-- Name: sensors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nathan
--

ALTER SEQUENCE public.sensors_id_seq OWNED BY public.sensors.id;


--
-- Name: readings id; Type: DEFAULT; Schema: public; Owner: nathan
--

ALTER TABLE ONLY public.readings ALTER COLUMN id SET DEFAULT nextval('public.readings_id_seq'::regclass);


--
-- Name: sensors id; Type: DEFAULT; Schema: public; Owner: nathan
--

ALTER TABLE ONLY public.sensors ALTER COLUMN id SET DEFAULT nextval('public.sensors_id_seq'::regclass);


--
-- Name: readings readings_pkey; Type: CONSTRAINT; Schema: public; Owner: nathan
--

ALTER TABLE ONLY public.readings
    ADD CONSTRAINT readings_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: nathan
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sensors sensors_pkey; Type: CONSTRAINT; Schema: public; Owner: nathan
--

ALTER TABLE ONLY public.sensors
    ADD CONSTRAINT sensors_pkey PRIMARY KEY (id);


--
-- Name: readings_sensor_id_index; Type: INDEX; Schema: public; Owner: nathan
--

CREATE INDEX readings_sensor_id_index ON public.readings USING btree (sensor_id);


--
-- Name: readings readings_sensor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nathan
--

ALTER TABLE ONLY public.readings
    ADD CONSTRAINT readings_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.sensors(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: TABLE readings; Type: ACL; Schema: public; Owner: nathan
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.readings TO app_user;


--
-- Name: SEQUENCE readings_id_seq; Type: ACL; Schema: public; Owner: nathan
--

GRANT ALL ON SEQUENCE public.readings_id_seq TO app_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: public; Owner: nathan
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.schema_migrations TO app_user;


--
-- Name: TABLE sensors; Type: ACL; Schema: public; Owner: nathan
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sensors TO app_user;


--
-- Name: SEQUENCE sensors_id_seq; Type: ACL; Schema: public; Owner: nathan
--

GRANT ALL ON SEQUENCE public.sensors_id_seq TO app_user;


--
-- PostgreSQL database dump complete
--

