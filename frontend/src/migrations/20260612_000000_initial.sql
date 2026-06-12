

CREATE SCHEMA IF NOT EXISTS payload;

CREATE TYPE payload.enum__blog_posts_v_version_status AS ENUM (
    'draft',
    'published'
);


CREATE TYPE payload.enum__projects_v_version_status AS ENUM (
    'draft',
    'published'
);


CREATE TYPE payload.enum_about_skills_category AS ENUM (
    'frontend',
    'backend',
    'design',
    'devops',
    'other'
);


CREATE TYPE payload.enum_blog_posts_status AS ENUM (
    'draft',
    'published'
);


CREATE TYPE payload.enum_categories_type AS ENUM (
    'project',
    'blog',
    'both'
);


CREATE TYPE payload.enum_projects_status AS ENUM (
    'draft',
    'published'
);


CREATE TABLE payload._blog_posts_v (
    id integer NOT NULL,
    parent_id integer,
    version_title character varying,
    version_slug character varying,
    version_excerpt character varying,
    version_content character varying,
    version_cover_image_id integer,
    version_category_id integer,
    version_published_date timestamp(3) with time zone,
    version_reading_time numeric,
    version_featured boolean DEFAULT false,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status payload.enum__blog_posts_v_version_status DEFAULT 'draft'::payload.enum__blog_posts_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    latest boolean
);

CREATE SEQUENCE payload._blog_posts_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload._blog_posts_v_id_seq OWNED BY payload._blog_posts_v.id;

CREATE TABLE payload._blog_posts_v_version_tags (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    name character varying,
    _uuid character varying
);

CREATE SEQUENCE payload._blog_posts_v_version_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload._blog_posts_v_version_tags_id_seq OWNED BY payload._blog_posts_v_version_tags.id;

CREATE TABLE payload._projects_v (
    id integer NOT NULL,
    parent_id integer,
    version_title character varying,
    version_slug character varying,
    version_description character varying,
    version_content character varying,
    version_cover_image_id integer,
    version_category_id integer,
    version_featured boolean DEFAULT false,
    version_featured_order numeric,
    version_live_url character varying,
    version_github_url character varying,
    version_start_date timestamp(3) with time zone,
    version_end_date timestamp(3) with time zone,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status payload.enum__projects_v_version_status DEFAULT 'draft'::payload.enum__projects_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    latest boolean
);

CREATE SEQUENCE payload._projects_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload._projects_v_id_seq OWNED BY payload._projects_v.id;

CREATE TABLE payload._projects_v_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    media_id integer
);

CREATE SEQUENCE payload._projects_v_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload._projects_v_rels_id_seq OWNED BY payload._projects_v_rels.id;

CREATE TABLE payload._projects_v_version_technologies (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    name character varying,
    _uuid character varying
);

CREATE SEQUENCE payload._projects_v_version_technologies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload._projects_v_version_technologies_id_seq OWNED BY payload._projects_v_version_technologies.id;

CREATE TABLE payload.about (
    id integer NOT NULL,
    name character varying NOT NULL,
    headline character varying,
    bio_short character varying,
    bio_full character varying,
    avatar_id integer,
    resume_url character varying,
    location character varying,
    available_for_work boolean DEFAULT true,
    updated_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone
);

CREATE TABLE payload.about_education (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    institution character varying NOT NULL,
    degree character varying NOT NULL,
    field character varying,
    start_date timestamp(3) with time zone,
    end_date timestamp(3) with time zone,
    description character varying
);

CREATE TABLE payload.about_experience (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    company character varying NOT NULL,
    "position" character varying NOT NULL,
    description character varying,
    start_date timestamp(3) with time zone NOT NULL,
    end_date timestamp(3) with time zone,
    is_current boolean DEFAULT false,
    location character varying,
    company_url character varying
);

CREATE SEQUENCE payload.about_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.about_id_seq OWNED BY payload.about.id;

CREATE TABLE payload.about_skills (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    name character varying NOT NULL,
    category payload.enum_about_skills_category DEFAULT 'other'::payload.enum_about_skills_category,
    proficiency numeric,
    icon character varying
);

CREATE TABLE payload.blog_posts (
    id integer NOT NULL,
    title character varying,
    slug character varying,
    excerpt character varying,
    content character varying,
    cover_image_id integer,
    category_id integer,
    published_date timestamp(3) with time zone,
    reading_time numeric,
    featured boolean DEFAULT false,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status payload.enum_blog_posts_status DEFAULT 'draft'::payload.enum_blog_posts_status
);

CREATE SEQUENCE payload.blog_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.blog_posts_id_seq OWNED BY payload.blog_posts.id;

CREATE TABLE payload.blog_posts_tags (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    name character varying
);

CREATE TABLE payload.categories (
    id integer NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    type payload.enum_categories_type DEFAULT 'both'::payload.enum_categories_type NOT NULL,
    description character varying,
    color character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE payload.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.categories_id_seq OWNED BY payload.categories.id;

CREATE TABLE payload.media (
    id integer NOT NULL,
    alt character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    url character varying,
    thumbnail_u_r_l character varying,
    filename character varying,
    mime_type character varying,
    filesize numeric,
    width numeric,
    height numeric,
    focal_x numeric,
    focal_y numeric
);

CREATE SEQUENCE payload.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.media_id_seq OWNED BY payload.media.id;

CREATE TABLE payload.payload_kv (
    id integer NOT NULL,
    key character varying NOT NULL,
    data jsonb NOT NULL
);

CREATE SEQUENCE payload.payload_kv_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.payload_kv_id_seq OWNED BY payload.payload_kv.id;

CREATE TABLE payload.payload_locked_documents (
    id integer NOT NULL,
    global_slug character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE payload.payload_locked_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.payload_locked_documents_id_seq OWNED BY payload.payload_locked_documents.id;

CREATE TABLE payload.payload_locked_documents_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer,
    media_id integer,
    categories_id integer,
    projects_id integer,
    blog_posts_id integer
);

CREATE SEQUENCE payload.payload_locked_documents_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.payload_locked_documents_rels_id_seq OWNED BY payload.payload_locked_documents_rels.id;

CREATE TABLE payload.payload_migrations (
    id integer NOT NULL,
    name character varying,
    batch numeric,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE payload.payload_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.payload_migrations_id_seq OWNED BY payload.payload_migrations.id;

CREATE TABLE payload.payload_preferences (
    id integer NOT NULL,
    key character varying,
    value jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE payload.payload_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.payload_preferences_id_seq OWNED BY payload.payload_preferences.id;

CREATE TABLE payload.payload_preferences_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer
);

CREATE SEQUENCE payload.payload_preferences_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.payload_preferences_rels_id_seq OWNED BY payload.payload_preferences_rels.id;

CREATE TABLE payload.projects (
    id integer NOT NULL,
    title character varying,
    slug character varying,
    description character varying,
    content character varying,
    cover_image_id integer,
    category_id integer,
    featured boolean DEFAULT false,
    featured_order numeric,
    live_url character varying,
    github_url character varying,
    start_date timestamp(3) with time zone,
    end_date timestamp(3) with time zone,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status payload.enum_projects_status DEFAULT 'draft'::payload.enum_projects_status
);

CREATE SEQUENCE payload.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.projects_id_seq OWNED BY payload.projects.id;

CREATE TABLE payload.projects_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    media_id integer
);

CREATE SEQUENCE payload.projects_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.projects_rels_id_seq OWNED BY payload.projects_rels.id;

CREATE TABLE payload.projects_technologies (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    name character varying
);

CREATE TABLE payload.site_settings (
    id integer NOT NULL,
    site_title character varying NOT NULL,
    site_description character varying,
    site_url character varying,
    og_image_id integer,
    newsletter_enabled boolean DEFAULT false,
    newsletter_title character varying,
    newsletter_description character varying,
    copyright_text character varying,
    updated_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone
);

CREATE SEQUENCE payload.site_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.site_settings_id_seq OWNED BY payload.site_settings.id;

CREATE TABLE payload.site_settings_social_links (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    platform character varying NOT NULL,
    url character varying NOT NULL,
    label character varying
);

CREATE TABLE payload.users (
    id integer NOT NULL,
    name character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    email character varying NOT NULL,
    reset_password_token character varying,
    reset_password_expiration timestamp(3) with time zone,
    salt character varying,
    hash character varying,
    login_attempts numeric DEFAULT 0,
    lock_until timestamp(3) with time zone
);

CREATE SEQUENCE payload.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE payload.users_id_seq OWNED BY payload.users.id;

CREATE TABLE payload.users_sessions (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    created_at timestamp(3) with time zone,
    expires_at timestamp(3) with time zone NOT NULL
);

ALTER TABLE ONLY payload._blog_posts_v ALTER COLUMN id SET DEFAULT nextval('payload._blog_posts_v_id_seq'::regclass);

ALTER TABLE ONLY payload._blog_posts_v_version_tags ALTER COLUMN id SET DEFAULT nextval('payload._blog_posts_v_version_tags_id_seq'::regclass);

ALTER TABLE ONLY payload._projects_v ALTER COLUMN id SET DEFAULT nextval('payload._projects_v_id_seq'::regclass);

ALTER TABLE ONLY payload._projects_v_rels ALTER COLUMN id SET DEFAULT nextval('payload._projects_v_rels_id_seq'::regclass);

ALTER TABLE ONLY payload._projects_v_version_technologies ALTER COLUMN id SET DEFAULT nextval('payload._projects_v_version_technologies_id_seq'::regclass);

ALTER TABLE ONLY payload.about ALTER COLUMN id SET DEFAULT nextval('payload.about_id_seq'::regclass);

ALTER TABLE ONLY payload.blog_posts ALTER COLUMN id SET DEFAULT nextval('payload.blog_posts_id_seq'::regclass);

ALTER TABLE ONLY payload.categories ALTER COLUMN id SET DEFAULT nextval('payload.categories_id_seq'::regclass);

ALTER TABLE ONLY payload.media ALTER COLUMN id SET DEFAULT nextval('payload.media_id_seq'::regclass);

ALTER TABLE ONLY payload.payload_kv ALTER COLUMN id SET DEFAULT nextval('payload.payload_kv_id_seq'::regclass);

ALTER TABLE ONLY payload.payload_locked_documents ALTER COLUMN id SET DEFAULT nextval('payload.payload_locked_documents_id_seq'::regclass);

ALTER TABLE ONLY payload.payload_locked_documents_rels ALTER COLUMN id SET DEFAULT nextval('payload.payload_locked_documents_rels_id_seq'::regclass);

ALTER TABLE ONLY payload.payload_migrations ALTER COLUMN id SET DEFAULT nextval('payload.payload_migrations_id_seq'::regclass);

ALTER TABLE ONLY payload.payload_preferences ALTER COLUMN id SET DEFAULT nextval('payload.payload_preferences_id_seq'::regclass);

ALTER TABLE ONLY payload.payload_preferences_rels ALTER COLUMN id SET DEFAULT nextval('payload.payload_preferences_rels_id_seq'::regclass);

ALTER TABLE ONLY payload.projects ALTER COLUMN id SET DEFAULT nextval('payload.projects_id_seq'::regclass);

ALTER TABLE ONLY payload.projects_rels ALTER COLUMN id SET DEFAULT nextval('payload.projects_rels_id_seq'::regclass);

ALTER TABLE ONLY payload.site_settings ALTER COLUMN id SET DEFAULT nextval('payload.site_settings_id_seq'::regclass);

ALTER TABLE ONLY payload.users ALTER COLUMN id SET DEFAULT nextval('payload.users_id_seq'::regclass);

ALTER TABLE ONLY payload._blog_posts_v
    ADD CONSTRAINT _blog_posts_v_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload._blog_posts_v_version_tags
    ADD CONSTRAINT _blog_posts_v_version_tags_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload._projects_v
    ADD CONSTRAINT _projects_v_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload._projects_v_rels
    ADD CONSTRAINT _projects_v_rels_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload._projects_v_version_technologies
    ADD CONSTRAINT _projects_v_version_technologies_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.about_education
    ADD CONSTRAINT about_education_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.about_experience
    ADD CONSTRAINT about_experience_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.about
    ADD CONSTRAINT about_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.about_skills
    ADD CONSTRAINT about_skills_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.blog_posts_tags
    ADD CONSTRAINT blog_posts_tags_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.payload_kv
    ADD CONSTRAINT payload_kv_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.payload_locked_documents
    ADD CONSTRAINT payload_locked_documents_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.payload_migrations
    ADD CONSTRAINT payload_migrations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.payload_preferences
    ADD CONSTRAINT payload_preferences_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.projects_rels
    ADD CONSTRAINT projects_rels_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.projects_technologies
    ADD CONSTRAINT projects_technologies_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.site_settings_social_links
    ADD CONSTRAINT site_settings_social_links_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY payload.users_sessions
    ADD CONSTRAINT users_sessions_pkey PRIMARY KEY (id);

CREATE INDEX _blog_posts_v_created_at_idx ON payload._blog_posts_v USING btree (created_at);

CREATE INDEX _blog_posts_v_latest_idx ON payload._blog_posts_v USING btree (latest);

CREATE INDEX _blog_posts_v_parent_idx ON payload._blog_posts_v USING btree (parent_id);

CREATE INDEX _blog_posts_v_updated_at_idx ON payload._blog_posts_v USING btree (updated_at);

CREATE INDEX _blog_posts_v_version_tags_order_idx ON payload._blog_posts_v_version_tags USING btree (_order);

CREATE INDEX _blog_posts_v_version_tags_parent_id_idx ON payload._blog_posts_v_version_tags USING btree (_parent_id);

CREATE INDEX _blog_posts_v_version_version__status_idx ON payload._blog_posts_v USING btree (version__status);

CREATE INDEX _blog_posts_v_version_version_category_idx ON payload._blog_posts_v USING btree (version_category_id);

CREATE INDEX _blog_posts_v_version_version_cover_image_idx ON payload._blog_posts_v USING btree (version_cover_image_id);

CREATE INDEX _blog_posts_v_version_version_created_at_idx ON payload._blog_posts_v USING btree (version_created_at);

CREATE INDEX _blog_posts_v_version_version_slug_idx ON payload._blog_posts_v USING btree (version_slug);

CREATE INDEX _blog_posts_v_version_version_updated_at_idx ON payload._blog_posts_v USING btree (version_updated_at);

CREATE INDEX _projects_v_created_at_idx ON payload._projects_v USING btree (created_at);

CREATE INDEX _projects_v_latest_idx ON payload._projects_v USING btree (latest);

CREATE INDEX _projects_v_parent_idx ON payload._projects_v USING btree (parent_id);

CREATE INDEX _projects_v_rels_media_id_idx ON payload._projects_v_rels USING btree (media_id);

CREATE INDEX _projects_v_rels_order_idx ON payload._projects_v_rels USING btree ("order");

CREATE INDEX _projects_v_rels_parent_idx ON payload._projects_v_rels USING btree (parent_id);

CREATE INDEX _projects_v_rels_path_idx ON payload._projects_v_rels USING btree (path);

CREATE INDEX _projects_v_updated_at_idx ON payload._projects_v USING btree (updated_at);

CREATE INDEX _projects_v_version_technologies_order_idx ON payload._projects_v_version_technologies USING btree (_order);

CREATE INDEX _projects_v_version_technologies_parent_id_idx ON payload._projects_v_version_technologies USING btree (_parent_id);

CREATE INDEX _projects_v_version_version__status_idx ON payload._projects_v USING btree (version__status);

CREATE INDEX _projects_v_version_version_category_idx ON payload._projects_v USING btree (version_category_id);

CREATE INDEX _projects_v_version_version_cover_image_idx ON payload._projects_v USING btree (version_cover_image_id);

CREATE INDEX _projects_v_version_version_created_at_idx ON payload._projects_v USING btree (version_created_at);

CREATE INDEX _projects_v_version_version_slug_idx ON payload._projects_v USING btree (version_slug);

CREATE INDEX _projects_v_version_version_updated_at_idx ON payload._projects_v USING btree (version_updated_at);

CREATE INDEX about_avatar_idx ON payload.about USING btree (avatar_id);

CREATE INDEX about_education_order_idx ON payload.about_education USING btree (_order);

CREATE INDEX about_education_parent_id_idx ON payload.about_education USING btree (_parent_id);

CREATE INDEX about_experience_order_idx ON payload.about_experience USING btree (_order);

CREATE INDEX about_experience_parent_id_idx ON payload.about_experience USING btree (_parent_id);

CREATE INDEX about_skills_order_idx ON payload.about_skills USING btree (_order);

CREATE INDEX about_skills_parent_id_idx ON payload.about_skills USING btree (_parent_id);

CREATE INDEX blog_posts__status_idx ON payload.blog_posts USING btree (_status);

CREATE INDEX blog_posts_category_idx ON payload.blog_posts USING btree (category_id);

CREATE INDEX blog_posts_cover_image_idx ON payload.blog_posts USING btree (cover_image_id);

CREATE INDEX blog_posts_created_at_idx ON payload.blog_posts USING btree (created_at);

CREATE UNIQUE INDEX blog_posts_slug_idx ON payload.blog_posts USING btree (slug);

CREATE INDEX blog_posts_tags_order_idx ON payload.blog_posts_tags USING btree (_order);

CREATE INDEX blog_posts_tags_parent_id_idx ON payload.blog_posts_tags USING btree (_parent_id);

CREATE INDEX blog_posts_updated_at_idx ON payload.blog_posts USING btree (updated_at);

CREATE INDEX categories_created_at_idx ON payload.categories USING btree (created_at);

CREATE UNIQUE INDEX categories_slug_idx ON payload.categories USING btree (slug);

CREATE INDEX categories_updated_at_idx ON payload.categories USING btree (updated_at);

CREATE INDEX media_created_at_idx ON payload.media USING btree (created_at);

CREATE UNIQUE INDEX media_filename_idx ON payload.media USING btree (filename);

CREATE INDEX media_updated_at_idx ON payload.media USING btree (updated_at);

CREATE UNIQUE INDEX payload_kv_key_idx ON payload.payload_kv USING btree (key);

CREATE INDEX payload_locked_documents_created_at_idx ON payload.payload_locked_documents USING btree (created_at);

CREATE INDEX payload_locked_documents_global_slug_idx ON payload.payload_locked_documents USING btree (global_slug);

CREATE INDEX payload_locked_documents_rels_blog_posts_id_idx ON payload.payload_locked_documents_rels USING btree (blog_posts_id);

CREATE INDEX payload_locked_documents_rels_categories_id_idx ON payload.payload_locked_documents_rels USING btree (categories_id);

CREATE INDEX payload_locked_documents_rels_media_id_idx ON payload.payload_locked_documents_rels USING btree (media_id);

CREATE INDEX payload_locked_documents_rels_order_idx ON payload.payload_locked_documents_rels USING btree ("order");

CREATE INDEX payload_locked_documents_rels_parent_idx ON payload.payload_locked_documents_rels USING btree (parent_id);

CREATE INDEX payload_locked_documents_rels_path_idx ON payload.payload_locked_documents_rels USING btree (path);

CREATE INDEX payload_locked_documents_rels_projects_id_idx ON payload.payload_locked_documents_rels USING btree (projects_id);

CREATE INDEX payload_locked_documents_rels_users_id_idx ON payload.payload_locked_documents_rels USING btree (users_id);

CREATE INDEX payload_locked_documents_updated_at_idx ON payload.payload_locked_documents USING btree (updated_at);

CREATE INDEX payload_migrations_created_at_idx ON payload.payload_migrations USING btree (created_at);

CREATE INDEX payload_migrations_updated_at_idx ON payload.payload_migrations USING btree (updated_at);

CREATE INDEX payload_preferences_created_at_idx ON payload.payload_preferences USING btree (created_at);

CREATE INDEX payload_preferences_key_idx ON payload.payload_preferences USING btree (key);

CREATE INDEX payload_preferences_rels_order_idx ON payload.payload_preferences_rels USING btree ("order");

CREATE INDEX payload_preferences_rels_parent_idx ON payload.payload_preferences_rels USING btree (parent_id);

CREATE INDEX payload_preferences_rels_path_idx ON payload.payload_preferences_rels USING btree (path);

CREATE INDEX payload_preferences_rels_users_id_idx ON payload.payload_preferences_rels USING btree (users_id);

CREATE INDEX payload_preferences_updated_at_idx ON payload.payload_preferences USING btree (updated_at);

CREATE INDEX projects__status_idx ON payload.projects USING btree (_status);

CREATE INDEX projects_category_idx ON payload.projects USING btree (category_id);

CREATE INDEX projects_cover_image_idx ON payload.projects USING btree (cover_image_id);

CREATE INDEX projects_created_at_idx ON payload.projects USING btree (created_at);

CREATE INDEX projects_rels_media_id_idx ON payload.projects_rels USING btree (media_id);

CREATE INDEX projects_rels_order_idx ON payload.projects_rels USING btree ("order");

CREATE INDEX projects_rels_parent_idx ON payload.projects_rels USING btree (parent_id);

CREATE INDEX projects_rels_path_idx ON payload.projects_rels USING btree (path);

CREATE UNIQUE INDEX projects_slug_idx ON payload.projects USING btree (slug);

CREATE INDEX projects_technologies_order_idx ON payload.projects_technologies USING btree (_order);

CREATE INDEX projects_technologies_parent_id_idx ON payload.projects_technologies USING btree (_parent_id);

CREATE INDEX projects_updated_at_idx ON payload.projects USING btree (updated_at);

CREATE INDEX site_settings_og_image_idx ON payload.site_settings USING btree (og_image_id);

CREATE INDEX site_settings_social_links_order_idx ON payload.site_settings_social_links USING btree (_order);

CREATE INDEX site_settings_social_links_parent_id_idx ON payload.site_settings_social_links USING btree (_parent_id);

CREATE INDEX users_created_at_idx ON payload.users USING btree (created_at);

CREATE UNIQUE INDEX users_email_idx ON payload.users USING btree (email);

CREATE INDEX users_sessions_order_idx ON payload.users_sessions USING btree (_order);

CREATE INDEX users_sessions_parent_id_idx ON payload.users_sessions USING btree (_parent_id);

CREATE INDEX users_updated_at_idx ON payload.users USING btree (updated_at);

ALTER TABLE ONLY payload._blog_posts_v
    ADD CONSTRAINT _blog_posts_v_parent_id_blog_posts_id_fk FOREIGN KEY (parent_id) REFERENCES payload.blog_posts(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload._blog_posts_v
    ADD CONSTRAINT _blog_posts_v_version_category_id_categories_id_fk FOREIGN KEY (version_category_id) REFERENCES payload.categories(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload._blog_posts_v
    ADD CONSTRAINT _blog_posts_v_version_cover_image_id_media_id_fk FOREIGN KEY (version_cover_image_id) REFERENCES payload.media(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload._blog_posts_v_version_tags
    ADD CONSTRAINT _blog_posts_v_version_tags_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload._blog_posts_v(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload._projects_v
    ADD CONSTRAINT _projects_v_parent_id_projects_id_fk FOREIGN KEY (parent_id) REFERENCES payload.projects(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload._projects_v_rels
    ADD CONSTRAINT _projects_v_rels_media_fk FOREIGN KEY (media_id) REFERENCES payload.media(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload._projects_v_rels
    ADD CONSTRAINT _projects_v_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES payload._projects_v(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload._projects_v
    ADD CONSTRAINT _projects_v_version_category_id_categories_id_fk FOREIGN KEY (version_category_id) REFERENCES payload.categories(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload._projects_v
    ADD CONSTRAINT _projects_v_version_cover_image_id_media_id_fk FOREIGN KEY (version_cover_image_id) REFERENCES payload.media(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload._projects_v_version_technologies
    ADD CONSTRAINT _projects_v_version_technologies_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload._projects_v(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.about
    ADD CONSTRAINT about_avatar_id_media_id_fk FOREIGN KEY (avatar_id) REFERENCES payload.media(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload.about_education
    ADD CONSTRAINT about_education_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.about(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.about_experience
    ADD CONSTRAINT about_experience_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.about(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.about_skills
    ADD CONSTRAINT about_skills_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.about(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.blog_posts
    ADD CONSTRAINT blog_posts_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES payload.categories(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload.blog_posts
    ADD CONSTRAINT blog_posts_cover_image_id_media_id_fk FOREIGN KEY (cover_image_id) REFERENCES payload.media(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload.blog_posts_tags
    ADD CONSTRAINT blog_posts_tags_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.blog_posts(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_blog_posts_fk FOREIGN KEY (blog_posts_id) REFERENCES payload.blog_posts(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_categories_fk FOREIGN KEY (categories_id) REFERENCES payload.categories(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_media_fk FOREIGN KEY (media_id) REFERENCES payload.media(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES payload.payload_locked_documents(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_projects_fk FOREIGN KEY (projects_id) REFERENCES payload.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_users_fk FOREIGN KEY (users_id) REFERENCES payload.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES payload.payload_preferences(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_users_fk FOREIGN KEY (users_id) REFERENCES payload.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.projects
    ADD CONSTRAINT projects_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES payload.categories(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload.projects
    ADD CONSTRAINT projects_cover_image_id_media_id_fk FOREIGN KEY (cover_image_id) REFERENCES payload.media(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload.projects_rels
    ADD CONSTRAINT projects_rels_media_fk FOREIGN KEY (media_id) REFERENCES payload.media(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.projects_rels
    ADD CONSTRAINT projects_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES payload.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.projects_technologies
    ADD CONSTRAINT projects_technologies_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.site_settings
    ADD CONSTRAINT site_settings_og_image_id_media_id_fk FOREIGN KEY (og_image_id) REFERENCES payload.media(id) ON DELETE SET NULL;

ALTER TABLE ONLY payload.site_settings_social_links
    ADD CONSTRAINT site_settings_social_links_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.site_settings(id) ON DELETE CASCADE;

ALTER TABLE ONLY payload.users_sessions
    ADD CONSTRAINT users_sessions_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES payload.users(id) ON DELETE CASCADE;
