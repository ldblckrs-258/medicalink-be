```dbml
  // ERD (DBML) – Hospital Management System (Revised with CUID)
  // PostgreSQL-focused. Uses timestamptz; emails as citext (requires: CREATE EXTENSION citext;)
  // All primary keys now use CUID (Collision-Resistant Unique ID) format
  // Advanced constraints like exclusion (no time overlaps) are noted below as SQL snippets.

  //// ENUMS

  Enum "staff_role" {
    SUPER_ADMIN
    ADMIN
    DOCTOR
  }

  Enum "appointment_status" {
    BOOKED
    CONFIRMED
    RESCHEDULED
    IN_PROGRESS
    CANCELLED_BY_PATIENT
    CANCELLED_BY_STAFF
    COMPLETED
    NO_SHOW
  }

  Enum "question_status" {
    PENDING
    ANSWERED
    CLOSED
  }

  Enum "gender" {
    MALE
    FEMALE
    OTHER
    UNKNOWN
  }

  //// TABLES

  // Staff accounts (Super Admin, Admin, Doctor login)
  Table staff_accounts {
    id              varchar [pk, default: `cuid()`, note: 'CUID primary key']
    full_name       varchar(100) [not null]
    email           citext [unique, not null, note: 'citext requires extension']
    password_hash   varchar [not null]
    role            staff_role [not null]
    gender          gender [not null, default: 'UNKNOWN']
    date_of_birth   date
    created_at      timestamptz [default: `now()`]
    updated_at      timestamptz [default: `now()`]
  }

  // Patients (public users)
  Table patients {
    id            varchar [pk, default: `cuid()`, note: 'CUID primary key']
    full_name     varchar(100) [not null]
    phone_number  varchar(15)
    email         citext [note: 'unique suggested via partial index when not null']
    date_of_birth date
    gender        gender [not null, default: 'UNKNOWN']
    address       text
    created_at    timestamptz [default: `now()`]
  }

  // Doctor profiles (1–1 with staff_accounts)
  Table doctors {
    id                varchar [pk, default: `cuid()`, note: 'CUID primary key']
    staff_account_id  varchar [unique, not null, note: 'Links to staff account for login']
    degree            varchar(100) [note: 'Học hàm, học vị']
    position          text[] [note: 'Chức vụ']
    introduction      text [note: 'Giới thiệu']
    memberships       text[] [note: 'Thành viên các tổ chức']
    awards            text[] [note: 'Danh hiệu, giải thưởng']
    research          text [note: 'Công trình nghiên cứu']
    training_process  text[] [note: 'Quá trình đào tạo']
    experience        text[] [note: 'Kinh nghiệm công tác']
    avatar_url        varchar
    portrait          varchar
  }

  // Specialties
  Table specialties {
    id          varchar [pk, default: `cuid()`, note: 'CUID primary key']
    name        varchar(200) [not null]
    description text
    created_at  timestamptz [default: `now()`]
  }

  // Work locations / branches
  Table work_locations {
    id          varchar [pk, default: `cuid()`, note: 'CUID primary key']
    name        varchar(200) [not null]
    address     text [not null]
    created_at  timestamptz [default: `now()`]
  }

  // Blog categories
  Table blog_categories {
    id    varchar [pk, default: `cuid()`, note: 'CUID primary key']
    name  varchar(100) [unique, not null]
  }

  // Blogs / News
  Table blogs {
    id          varchar [pk, default: `cuid()`, note: 'CUID primary key']
    title       varchar(500) [not null]
    description text
    content     text [not null]
    author_id   varchar [not null, note: 'FK to staff_accounts (CUID)']
    category_id varchar [note: 'FK to blog_categories (CUID)']
    created_at  timestamptz [default: `now()`]
    updated_at  timestamptz [default: `now()`]

    Indexes {
      (category_id, created_at)
    }
  }

  // Doctor schedules (available time slots)
  Table schedules {
    id               varchar [pk, default: `cuid()`, note: 'CUID primary key']
    doctor_id        varchar [not null, note: 'FK to doctors (CUID)']
    work_location_id varchar [not null, note: 'FK to work_locations (CUID)']
    date             date [not null]
    time_slot_start  time [not null]
    time_slot_end    time [not null]

    // Unique exact duplicate guard
    Indexes {
      (doctor_id, work_location_id, date, time_slot_start, time_slot_end) [unique]
      (doctor_id, date)
    }

    Note: 'Use SQL exclusion constraint to prevent overlapping slots for the same doctor & location (see snippet below). Also add CHECK time_slot_start < time_slot_end.'
  }

  // Appointments (occupy exactly one schedule slot)
  Table appointments {
    id           varchar [pk, default: `cuid()`, note: 'CUID primary key']
    patient_id   varchar [not null, note: 'FK to patients (CUID)']
    schedule_id  varchar [not null, unique, note: 'A schedule slot can be booked at most once (CUID)']
    symptoms     text
    notes        text
    status       appointment_status [not null, default: 'BOOKED']
    created_at   timestamptz [default: `now()`]
    updated_at   timestamptz [default: `now()`]

    Indexes {
      (patient_id)
      (status, created_at)
    }
  }

  // Reviews (patient feedback for doctors)
  Table reviews {
    id             varchar [pk, default: `cuid()`, note: 'CUID primary key']
    doctor_id      varchar [not null, note: 'FK to doctors (CUID)']
    patient_id     varchar [note: 'FK to patients (CUID), nullable for anonymous']
    rating         integer [not null, note: 'CHECK 1..5 in SQL']
    content        text [not null]
    is_anonymous   boolean [not null, default: false]
    created_at     timestamptz [default: `now()`]

    Indexes {
      (doctor_id, created_at)
      // optional policy: (appointment_id) [unique]
    }
  }

  // Q&A – Questions from users
  Table questions {
    id            varchar [pk, default: `cuid()`, note: 'CUID primary key']
    specialty_id  varchar [not null, note: 'FK to specialties (CUID)']
    asker_name    varchar(100)
    asker_email   citext
    title         varchar(100) [not null]
    content       text [not null]
    is_anonymous  boolean [not null, default: false]
    status        question_status [not null, default: 'PENDING']
    created_at    timestamptz [default: `now()`]
  }

  // Answers from doctors (1 answer per question)
  Table answers {
    id           varchar [pk, default: `cuid()`, note: 'CUID primary key']
    question_id  varchar [unique, not null, note: 'FK to questions (CUID)']
    doctor_id    varchar [not null, note: 'FK to doctors (CUID)']
    content      text [not null]
    created_at   timestamptz [default: `now()`]
  }

  // Doctor–Specialty (M:N)
  Table doctor_specialties {
    doctor_id     varchar [not null, note: 'FK to doctors (CUID)']
    specialty_id  varchar [not null, note: 'FK to specialties (CUID)']

    Indexes {
      (doctor_id, specialty_id) [pk]
    }
  }

  //// RELATIONSHIPS

  Ref: doctors.staff_account_id > staff_accounts.id // 1–1

  Ref: doctor_specialties.doctor_id > doctors.id
  Ref: doctor_specialties.specialty_id > specialties.id

  Ref: schedules.doctor_id > doctors.id
  Ref: schedules.work_location_id > work_locations.id

  Ref: appointments.patient_id > patients.id
  Ref: appointments.schedule_id > schedules.id

  Ref: blogs.author_id > staff_accounts.id
  Ref: blogs.category_id > blog_categories.id

  Ref: reviews.doctor_id > doctors.id
  Ref: reviews.patient_id > patients.id

  Ref: questions.specialty_id > specialties.id

  Ref: answers.question_id > questions.id
  Ref: answers.doctor_id > doctors.id

  //// MIGRATION NOTES

  // CUID Migration Changes:
  // - All primary keys changed from integer to varchar with cuid() default
  // - All foreign key references updated to varchar type
  // - Patient.id changed from varchar(12) to cuid() for consistency
  // - Maintains referential integrity with updated type system
  // - CUID provides better distribution and collision resistance
  // - Compatible with distributed systems and reduces hotspots
```