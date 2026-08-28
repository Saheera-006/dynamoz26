import React, { useEffect, useMemo, useState } from "react";
import "./index.css";
import { supabase } from "./lib/supabase";

const DEmblem = "/d-emblem.png";
/* =========================================================
   TYPES
========================================================= */

type Section =
  | "home"
  | "events"
  | "about"
  | "team"
  | "contact";

type EventCategory = "technical" | "non-technical";
type EventMode = "individual" | "team";

type EventRound = {
  id: string;
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  mode: string;
};

type EventItem = {
  id: string;
  name: string;
  category: EventCategory;
  mode: EventMode;
  description: string;
  poster: string;
  posterImage?: string;
  teamSize: number;
  rules: string;
  eligibility: string;
  prize: string;
  enabled: boolean;
  rounds: EventRound[];
};

type Person = {
  id: string;
  role: string;
  name: string;
  initials: string;
  description: string;
};

type SiteConfig = {
  heroWelcome: string;
  heroTitle: string;
  heroYear: string;
  heroTaglineOne: string;
  heroTaglineTwo: string;
  heroTaglineThree: string;

  eventDate: string;
  registrationDeadline: string;

  aboutSubtitle: string;
  aboutLead: string;
  aboutDescription: string;
  department: string;
  institution: string;

  people: Person[];

  contactDepartment: string;
  contactInstitution: string;
  contactEmail: string;
  contactLocation: string;

  instagram: string;
  linkedin: string;
  youtube: string;
  x: string;

  registrationEnabled: boolean;
};

type StudentDetails = {
  fullName: string;
  registerNumber: string;
  department: string;
  year: string;
  email: string;
  phone: string;
};

type TeamMember = {
  name: string;
  registerNumber: string;
};

type TeamDetails = {
  teamName: string;
  members: TeamMember[];
};

type Registration = {
  id: string;
  student: StudentDetails;
  selectedEvents: string[];
  teams: Record<string, TeamDetails>;
  createdAt: string;
};

/* =========================================================
   DEFAULT DATA
========================================================= */

const DEPARTMENT_OPTIONS = [
  { label: "CSE A", value: "CSE A" },
  { label: "CSE B", value: "CSE B" },
  { label: "IT", value: "IT" },
  { label: "ECE", value: "ECE" },
  { label: "EEE", value: "EEE" },
  { label: "MECH", value: "MECH" },
  { label: "CIVIL", value: "CIVIL" },
];

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: "ideathon",
    name: "IDEATHON",
    category: "technical",
    mode: "team",
    description:
      "Transform bold ideas into practical solutions through creativity, innovation and technology.",
    poster: "IDEA",
    teamSize: 4,
    rules:
      "Participants must present an original idea. Plagiarism is strictly prohibited.",
    eligibility:
      "Open to college students. Team participation required.",
    prize: "Exciting prizes and certificates",
    enabled: true,
    rounds: [
      {
        id: "ideathon-r1",
        name: "IDEA SUBMISSION",
        description: "Submit your innovative idea and problem statement.",
        date: "2026-09-10",
        startTime: "10:00",
        endTime: "11:00",
        venue: "Seminar Hall",
        mode: "Offline",
      },
      {
        id: "ideathon-r2",
        name: "FINAL PRESENTATION",
        description: "Shortlisted teams present their idea before the jury.",
        date: "2026-09-10",
        startTime: "14:00",
        endTime: "15:00",
        venue: "Main Auditorium",
        mode: "Offline",
      },
    ],
  },
  {
    id: "designing",
    name: "DESIGNING",
    category: "technical",
    mode: "individual",
    description:
      "Showcase your visual thinking and create designs that communicate powerful ideas.",
    poster: "DES",
    teamSize: 1,
    rules:
      "Design must be original. Participants must complete the challenge within the given time.",
    eligibility: "Open to all registered college students.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [
      {
        id: "designing-r1",
        name: "DESIGN CHALLENGE",
        description: "Create a design based on the problem statement.",
        date: "2026-09-10",
        startTime: "11:00",
        endTime: "12:00",
        venue: "Lab 1",
        mode: "Offline",
      },
    ],
  },
  {
    id: "code-relay",
    name: "CODE RELAY",
    category: "technical",
    mode: "team",
    description:
      "A fast-paced coding challenge where teamwork, logic and speed decide the winner.",
    poster: "CODE",
    teamSize: 4,
    rules:
      "Teams must solve programming challenges within the allotted time.",
    eligibility: "Open to students with programming interest.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [
      {
        id: "code-r1",
        name: "QUALIFIER",
        description: "Initial programming challenge.",
        date: "2026-09-10",
        startTime: "11:00",
        endTime: "12:00",
        venue: "Computer Lab",
        mode: "Offline",
      },
      {
        id: "code-r2",
        name: "FINAL",
        description: "Final coding challenge for shortlisted teams.",
        date: "2026-09-10",
        startTime: "15:00",
        endTime: "16:00",
        venue: "Computer Lab",
        mode: "Offline",
      },
    ],
  },
  {
    id: "tech-event-4",
    name: "TECHNICAL EVENT 4",
    category: "technical",
    mode: "individual",
    description:
      "Put your technical knowledge and problem-solving ability to the ultimate test.",
    poster: "TECH",
    teamSize: 1,
    rules: "Follow the instructions given by the event coordinators.",
    eligibility: "Open to college students.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [],
  },
  {
    id: "event-1",
    name: "EVENT 1",
    category: "non-technical",
    mode: "individual",
    description:
      "A fun challenge designed to test your presence of mind, creativity and confidence.",
    poster: "01",
    teamSize: 1,
    rules: "Follow the instructions given by the coordinators.",
    eligibility: "Open to all registered participants.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [],
  },
  {
    id: "event-2",
    name: "EVENT 2",
    category: "non-technical",
    mode: "team",
    description:
      "Work together, think differently and experience an exciting competitive challenge.",
    poster: "02",
    teamSize: 4,
    rules: "Team members must cooperate throughout the event.",
    eligibility: "Open to college students.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [],
  },
  {
    id: "event-3",
    name: "EVENT 3",
    category: "non-technical",
    mode: "individual",
    description:
      "A high-energy challenge where quick thinking and creativity take centre stage.",
    poster: "03",
    teamSize: 1,
    rules: "Participants must follow coordinator instructions.",
    eligibility: "Open to college students.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [],
  },
  {
    id: "event-4",
    name: "EVENT 4",
    category: "non-technical",
    mode: "team",
    description:
      "Bring your team together and take on a challenge built for fun and collaboration.",
    poster: "04",
    teamSize: 4,
    rules: "Teamwork and fair play are required.",
    eligibility: "Open to college students.",
    prize: "Prizes and certificates",
    enabled: true,
    rounds: [],
  },
];

const DEFAULT_CONFIG: SiteConfig = {
  heroWelcome: "WELCOME TO",
  heroTitle: "DYNAMOZ",
  heroYear: "26",
  heroTaglineOne: "IGNITE.",
  heroTaglineTwo: "INNOVATE.",
  heroTaglineThree: "INSPIRE.",

  eventDate: "2026-09-21T00:00:00",
  registrationDeadline: "2026-09-10T23:59:59",

  aboutSubtitle: "Where ideas ignite and innovation takes form.",
  aboutLead:
    "DYNAMOZ 26 is a technical symposium built to bring together students, ideas and challenges in one high-energy experience.",
  aboutDescription:
    "From technology-driven competitions to creative non-technical challenges, DYNAMOZ is designed to encourage curiosity, collaboration and innovation.",
  department: "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING",
  institution: "UNIVERSITY COLLEGE OF ENGINEERING, NAGERCOIL",

  people: [
    {
      id: "person-1",
      role: "HEAD OF DEPARTMENT",
      name: "Dr. K.L. Neela",
      initials: "KN",
      description:
        "Guiding the department with vision and academic excellence.",
    },
    {
      id: "person-2",
      role: "SYMPOSIUM COORDINATOR",
      name: "Dr. K. Ramesh",
      initials: "KR",
      description:
        "Orchestrating DYNAMOZ 26 with precision and passion for innovation.",
    },
  ],

  contactDepartment: "COMPUTER SCIENCE AND ENGINEERING",
  contactInstitution:
    "UNIVERSITY COLLEGE OF ENGINEERING, NAGERCOIL",
  contactEmail: "dynamoz26@example.com",
  contactLocation: "NAGERCOIL, TAMIL NADU",

  instagram: "#",
  linkedin: "#",
  youtube: "#",
  x: "#",

  registrationEnabled: true,
};

/* =========================================================
   STORAGE
========================================================= */

const EVENTS_KEY = "dynamoz26_events";
const CONFIG_KEY = "dynamoz26_site_config";
const REGISTRATIONS_KEY = "dynamoz26_registrations";

const getStoredEvents = (): EventItem[] => {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);

    if (!raw) return DEFAULT_EVENTS;

    const parsed = JSON.parse(raw) as EventItem[];

    if (!Array.isArray(parsed)) return DEFAULT_EVENTS;

    return parsed;
  } catch {
    return DEFAULT_EVENTS;
  }
};

const saveEvents = (events: EventItem[]) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

const getStoredConfig = (): SiteConfig => {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);

    if (!raw) return DEFAULT_CONFIG;

    const stored = JSON.parse(raw) as Partial<SiteConfig>;

    // Migrate the older demo dates once, while preserving any other
    // values the admin may already have edited.
    if (stored.eventDate === "2026-09-10T00:00:00") {
      stored.eventDate = DEFAULT_CONFIG.eventDate;
    }

    if (
      stored.registrationDeadline ===
      "2026-09-05T23:59:59"
    ) {
      stored.registrationDeadline =
        DEFAULT_CONFIG.registrationDeadline;
    }

    const merged = {
      ...DEFAULT_CONFIG,
      ...stored,
    };

    localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
};

const saveConfig = (config: SiteConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

const getStoredRegistrations = (): Registration[] => {
  try {
    const raw = localStorage.getItem(REGISTRATIONS_KEY);

    if (!raw) return [];

    return JSON.parse(raw) as Registration[];
  } catch {
    return [];
  }
};

const saveRegistration = (registration: Registration) => {
  const existing = getStoredRegistrations();

  localStorage.setItem(
    REGISTRATIONS_KEY,
    JSON.stringify([...existing, registration])
  );
};

const fetchCloudRegistrations = async (): Promise<Registration[]> => {
  const { data: registrationRows, error: registrationError } =
    await supabase
      .from("registrations")
      .select("registration_id, student_id, selected_events, teams, created_at")
      .order("created_at", { ascending: false });

  if (registrationError) {
    throw registrationError;
  }

  if (!registrationRows?.length) return [];

  const studentIds = Array.from(
    new Set(
      registrationRows
        .map((row) => row.student_id)
        .filter(Boolean)
    )
  );

  const { data: studentRows, error: studentError } =
    await supabase
      .from("students")
      .select("id, register_number, full_name, department, year, email, phone")
      .in("id", studentIds);

  if (studentError) {
    throw studentError;
  }

  const studentsById = new Map(
    (studentRows ?? []).map((student) => [student.id, student])
  );

  return registrationRows.flatMap((row) => {
    const student = studentsById.get(row.student_id);
    if (!student) return [];

    return [
      {
        id: row.registration_id,
        student: {
          fullName: student.full_name ?? "",
          registerNumber: student.register_number ?? "",
          department: student.department ?? "",
          year: student.year ?? "",
          email: student.email ?? "",
          phone: student.phone ?? "",
        },
        selectedEvents: Array.isArray(row.selected_events)
          ? row.selected_events
          : [],
        teams: row.teams && typeof row.teams === "object"
          ? row.teams
          : {},
        createdAt: row.created_at ?? "",
      } satisfies Registration,
    ];
  });
};

const generateId = (prefix = "id") =>
  `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const generateRegistrationId = () =>
  `D26-${Date.now().toString().slice(-8)}`;

const downloadCSV = (filename: string, rows: string[][]) => {
  const csv = rows
    .map((row) =>
      row
        .map((value) =>
          `"${String(value).replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
};

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (dateString: string) => {
  if (!dateString) return "TBA";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isRegistrationDeadlinePassed = (deadline: string) => {
  if (!deadline) return false;

  const time = new Date(deadline).getTime();

  if (Number.isNaN(time)) return false;

  return Date.now() > time;
};

/* =========================================================
   NAVBAR
========================================================= */

function Navbar({
  onSection,
  onRegister,
  config,
}: {
  onSection: (section: Section) => void;
  onRegister: () => void;
  config: SiteConfig;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: { label: string; section: Section }[] = [
    { label: "HOME", section: "home" },
    { label: "EVENTS", section: "events" },
    { label: "ABOUT", section: "about" },
    { label: "TEAM", section: "team" },
    { label: "CONTACT", section: "contact" },
  ];

  const handleNavigation = (section: Section) => {
    onSection(section);
    setMenuOpen(false);
  };

  const registrationAvailable =
    config.registrationEnabled &&
    !isRegistrationDeadlinePassed(config.registrationDeadline);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button
          className="brand"
          onClick={() => handleNavigation("home")}
          aria-label="DYNAMOZ Home"
        >
          <img
            src={DEmblem}
            alt="DYNAMOZ emblem"
            className="brand-emblem"
          />

          <span className="brand-word">{config.heroTitle}</span>

          <span className="brand-year">{config.heroYear}</span>
        </button>

        <nav
          className={`desktop-nav ${menuOpen ? "mobile-open" : ""
            }`}
        >
          {navItems.map((item) => (
            <button
              key={item.section}
              className="nav-link"
              onClick={() => handleNavigation(item.section)}
            >
              {item.label}
            </button>
          ))}

          <button
            className="mobile-register"
            disabled={!registrationAvailable}
            onClick={() => {
              setMenuOpen(false);
              onRegister();
            }}
          >
            {registrationAvailable
              ? "REGISTER NOW"
              : "REGISTRATION CLOSED"}{" "}
            <span>↗</span>
          </button>
        </nav>

        <button
          className="nav-register"
          disabled={!registrationAvailable}
          onClick={onRegister}
        >
          {registrationAvailable
            ? "REGISTER NOW"
            : "REGISTRATION CLOSED"}{" "}
          <span>↗</span>
        </button>

        <button
          className={`hamburger ${menuOpen ? "active" : ""
            }`}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   SOCIAL RAIL
========================================================= */

function SocialRail({
  config,
}: {
  config: SiteConfig;
}) {
  return (
    <div className="social-rail">
      <a href={config.instagram} aria-label="Instagram">
        ◎
      </a>

      <a href={config.linkedin} aria-label="LinkedIn">
        in
      </a>

      <a href={config.youtube} aria-label="YouTube">
        ▶
      </a>

      <a href={config.x} aria-label="X">
        𝕏
      </a>
    </div>
  );
}

/* =========================================================
   HERO
========================================================= */

function HeroSection({
  onRegister,
  onEvents,
  config,
}: {
  onRegister: () => void;
  onEvents: () => void;
  config: SiteConfig;
}) {
  const [typedText, setTypedText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const typingPhrases = [
    "Ignite.",
    "Innovate.",
    "Inspire.",
  ];

  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const phrase = typingPhrases[typingIndex];
    const finishedTyping = !isDeleting && typedText === phrase;
    const finishedDeleting = isDeleting && typedText === "";

    const delay = finishedTyping
      ? 1100
      : isDeleting
        ? 65
        : 125;

    const timer = window.setTimeout(() => {
      if (finishedTyping) {
        setIsDeleting(true);
        return;
      }

      if (finishedDeleting) {
        setIsDeleting(false);
        setTypingIndex(
          (typingIndex + 1) % typingPhrases.length
        );
        return;
      }

      if (isDeleting) {
        setTypedText(typedText.slice(0, -1));
      } else {
        setTypedText(phrase.slice(0, typedText.length + 1));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [typedText, typingIndex, isDeleting]);

  useEffect(() => {
    const target = new Date(
      config.eventDate
    ).getTime();

    const updateCountdown = () => {
      const distance = Math.max(0, target - Date.now());

      const days = Math.floor(
        distance / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (distance / (1000 * 60 * 60)) % 24
      );

      const minutes = Math.floor(
        (distance / (1000 * 60)) % 60
      );

      const seconds = Math.floor(
        (distance / 1000) % 60
      );

      setCountdown({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    updateCountdown();

    const timer = window.setInterval(
      updateCountdown,
      1000
    );

    return () => window.clearInterval(timer);
  }, [config.eventDate]);

  const registrationAvailable =
    config.registrationEnabled &&
    !isRegistrationDeadlinePassed(
      config.registrationDeadline
    );

  return (
    <section id="home" className="hero">
      <div className="hero-noise" />

      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />

      <div className="hero-content">
        <div className="hero-kicker">
          <span />
          {config.heroWelcome}
        </div>

        <h1 className="hero-title">
          <span>{config.heroTitle}</span>
          <strong>{config.heroYear}</strong>
        </h1>

        <div className="hero-divider" />

        <div className="hero-tagline">
          <span className="red">
            {config.heroTaglineOne}
          </span>

          <span className="orange">
            {config.heroTaglineTwo}
          </span>

          <span>{config.heroTaglineThree}</span>
        </div>

        <div className="typing-line">
          {typedText}
          <span className="typing-cursor" />
        </div>

        <div className="hero-buttons">
          <button
            className="primary-button"
            onClick={onEvents}
          >
            EXPLORE EVENTS
            <span>↗</span>
          </button>

          <button
            className="outline-button"
            disabled={!registrationAvailable}
            onClick={onRegister}
          >
            {registrationAvailable
              ? "REGISTER NOW"
              : "REGISTRATION CLOSED"}
            <span>↗</span>
          </button>
        </div>

        <div className="countdown-block">
          <div className="countdown-label">
            EVENT COUNTDOWN
            <span />
          </div>

          <div className="countdown-box">
            <CountdownUnit
              value={countdown.days}
              label="DAYS"
            />

            <CountdownUnit
              value={countdown.hours}
              label="HOURS"
            />

            <CountdownUnit
              value={countdown.minutes}
              label="MINUTES"
            />

            <CountdownUnit
              value={countdown.seconds}
              label="SECONDS"
            />
          </div>

          <div className="hero-dates">
            <div className="hero-date-item">
              <span>EVENT DATE</span>
              <strong>{formatDate(config.eventDate)}</strong>
            </div>

            <div className="hero-date-item deadline">
              <span>REGISTRATION DEADLINE</span>
              <strong>{formatDate(config.registrationDeadline)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-emblem-wrap">
        <div className="emblem-aura" />
        <div className="emblem-ring ring-one" />
        <div className="emblem-ring ring-two" />

        <div className="emblem-platform">
          <div className="platform-line" />
          <div className="platform-line second" />
        </div>

        <img
          src={DEmblem}
          alt="DYNAMOZ emblem"
          className="hero-emblem"
        />

        <div className="emblem-particles">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="hero-values">
        <ValueItem
          icon="♨"
          title="IGNITE"
        />

        <ValueItem
          icon="♧"
          title="INNOVATE"
        />

        <ValueItem
          icon="✦"
          title="INSPIRE"
          light
        />
      </div>

      <div className="hero-scroll">
        <span>SCROLL TO EXPLORE</span>
        <i />
      </div>
    </section>
  );
}

function CountdownUnit({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="countdown-unit">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ValueItem({
  icon,
  title,
  light,
}: {
  icon: string;
  title: string;
  light?: boolean;
}) {
  return (
    <div
      className={`value-item ${light ? "light" : ""
        }`}
    >
      <span className="value-icon">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="section-heading">
      <div className="section-number">
        {number} / <span>{title}</span>
      </div>

      <h2>{title}</h2>

      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

/* =========================================================
   EVENTS
========================================================= */

function EventsSection({
  onRegister,
  events,
}: {
  onRegister: (eventId?: string) => void;
  events: EventItem[];
}) {
  const [filter, setFilter] = useState<
    "all" | "technical" | "non-technical"
  >("all");

  const [selectedEvent, setSelectedEvent] =
    useState<EventItem | null>(null);

  const visibleEvents = events.filter(
    (event) => event.enabled
  );

  const filteredEvents = useMemo(() => {
    if (filter === "all") return visibleEvents;

    return visibleEvents.filter(
      (event) => event.category === filter
    );
  }, [filter, events]);

  return (
    <section
      id="events"
      className="section events-section"
    >
      <div className="section-container">
        <SectionHeader
          number="03"
          title="THE EVENTS"
          subtitle="Choose your challenge. Make your mark."
        />

        <div className="event-filter">
          {(
            [
              "all",
              "technical",
              "non-technical",
            ] as const
          ).map((item) => (
            <button
              key={item}
              className={
                filter === item ? "active" : ""
              }
              onClick={() => setFilter(item)}
            >
              {item === "all"
                ? "ALL"
                : item === "technical"
                  ? "TECHNICAL"
                  : "NON-TECHNICAL"}
            </button>
          ))}
        </div>

        <div className="events-grid">
          {filteredEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              onView={() =>
                setSelectedEvent(event)
              }
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="empty-admin">
            NO EVENTS AVAILABLE
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() =>
            setSelectedEvent(null)
          }
          onRegister={() => {
            setSelectedEvent(null);
            onRegister(selectedEvent.id);
          }}
        />
      )}
    </section>
  );
}

function EventCard({
  event,
  index,
  onView,
}: {
  event: EventItem;
  index: number;
  onView: () => void;
}) {
  return (
    <article
      className="event-card"
      style={{
        animationDelay: `${index * 70}ms`,
      }}
    >
      <div className={`event-poster ${event.posterImage ? "has-poster-image" : ""}`}>
        {event.posterImage ? (
          <img
            src={event.posterImage}
            alt={`${event.name} poster`}
            className="event-poster-image"
          />
        ) : (
          <>
            <div className="poster-grid" />
            <span className="poster-watermark">
              {event.poster}
            </span>
          </>
        )}

        <div className="event-badges">
          <span className="event-badge">
            {event.category === "technical"
              ? "TECHNICAL"
              : "NON-TECHNICAL"}
          </span>

          <span className="event-badge mode">
            {event.mode === "team"
              ? `TEAM · ${event.teamSize}`
              : "INDIVIDUAL"}
          </span>
        </div>

        <div className="poster-number">
          {(index + 1)
            .toString()
            .padStart(2, "0")}
        </div>
      </div>

      <div className="event-content">
        <div className="event-small-label">
          {event.mode === "team"
            ? "TEAM EVENT"
            : "INDIVIDUAL EVENT"}
        </div>

        <h3>{event.name}</h3>

        <p>{event.description}</p>

        <button
          className="event-view"
          onClick={onView}
        >
          VIEW DETAILS
          <span>↗</span>
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   EVENT MODAL
========================================================= */

function EventModal({
  event,
  onClose,
  onRegister,
}: {
  event: EventItem;
  onClose: () => void;
  onRegister: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="event-modal"
        onClick={(eventClick) =>
          eventClick.stopPropagation()
        }
      >
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className={`modal-poster ${event.posterImage ? "has-poster-image" : ""}`}>
          {event.posterImage ? (
            <img src={event.posterImage} alt={`${event.name} poster`} />
          ) : (
            <span>{event.poster}</span>
          )}
        </div>

        <div className="modal-content">
          <div className="event-small-label">
            {event.category === "technical"
              ? "TECHNICAL EVENT"
              : "NON-TECHNICAL EVENT"}
          </div>

          <h2>{event.name}</h2>

          <p>{event.description}</p>

          <div className="modal-info">
            <div>
              <span>FORMAT</span>
              <strong>
                {event.mode === "team"
                  ? `TEAM · ${event.teamSize} MEMBERS`
                  : "INDIVIDUAL"}
              </strong>
            </div>

            <div>
              <span>PRIZE</span>
              <strong>{event.prize}</strong>
            </div>

            <div>
              <span>ELIGIBILITY</span>
              <strong>{event.eligibility}</strong>
            </div>
          </div>

          {event.rules && (
            <div className="event-modal-block">
              <span>RULES</span>
              <p>{event.rules}</p>
            </div>
          )}

          {event.rounds.length > 0 && (
            <div className="event-rounds">
              <div className="event-rounds-title">
                EVENT ROUNDS
              </div>

              {event.rounds.map(
                (round, index) => (
                  <div
                    className="event-round"
                    key={round.id}
                  >
                    <div className="event-round-number">
                      {(index + 1)
                        .toString()
                        .padStart(2, "0")}
                    </div>

                    <div>
                      <strong>
                        {round.name}
                      </strong>

                      <p>
                        {round.description}
                      </p>

                      <small>
                        {formatDate(round.date)} ·{" "}
                        {round.startTime} -{" "}
                        {round.endTime} ·{" "}
                        {round.venue} ·{" "}
                        {round.mode}
                      </small>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <button
            className="primary-button full"
            onClick={onRegister}
          >
            REGISTER FOR THIS EVENT
            <span>↗</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ABOUT
========================================================= */

function AboutSection({
  config,
}: {
  config: SiteConfig;
}) {
  return (
    <section
      id="about"
      className="section about-section"
    >
      <div className="section-container about-layout">
        <div>
          <SectionHeader
            number="04"
            title="ABOUT DYNAMOZ"
            subtitle={config.aboutSubtitle}
          />
        </div>

        <div className="about-copy">
          <div className="about-big-number">
            {config.heroYear}
          </div>

          <p className="about-lead">
            {config.aboutLead}
          </p>

          <p>{config.aboutDescription}</p>

          <div className="about-location">
            <span>ORGANISED BY</span>

            <strong>
              {config.department}
            </strong>

            <strong>
              {config.institution}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PEOPLE
========================================================= */

function PeopleSection({
  config,
}: {
  config: SiteConfig;
}) {
  return (
    <section
      id="team"
      className="section team-section"
    >
      <div className="section-container">
        <SectionHeader
          number="05"
          title="THE PEOPLE"
          subtitle="The people behind DYNAMOZ 26."
        />

        <div className="people-grid">
          {config.people.map((person) => (
            <article
              className="person-card"
              key={person.id}
            >
              <div className="person-top-line" />

              <div className="person-initials">
                {person.initials}
              </div>

              <div className="person-role">
                {person.role}
              </div>

              <h3>{person.name}</h3>

              <p>{person.description}</p>

              <div className="person-watermark">
                {person.initials}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CONTACT
========================================================= */

function ContactSection({
  config,
}: {
  config: SiteConfig;
}) {
  return (
    <section
      id="contact"
      className="section contact-section"
    >
      <div className="section-container contact-layout">
        <div>
          <SectionHeader
            number="06"
            title="CONTACT"
            subtitle="Have a question? Reach out to the DYNAMOZ team."
          />
        </div>

        <div className="contact-card">
          <div className="contact-row">
            <span>DEPARTMENT</span>
            <strong>
              {config.contactDepartment}
            </strong>
          </div>

          <div className="contact-row">
            <span>INSTITUTION</span>
            <strong>
              {config.contactInstitution}
            </strong>
          </div>

          <div className="contact-row">
            <span>EMAIL</span>
            <strong>
              {config.contactEmail}
            </strong>
          </div>

          <div className="contact-row">
            <span>LOCATION</span>
            <strong>
              {config.contactLocation}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function Footer({
  config,
}: {
  config: SiteConfig;
}) {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <img
          src={DEmblem}
          alt="DYNAMOZ"
        />

        <div>
          <strong>
            {config.heroTitle}{" "}
            <span>{config.heroYear}</span>
          </strong>

          <small>
            {config.heroTaglineOne}{" "}
            {config.heroTaglineTwo}{" "}
            {config.heroTaglineThree}
          </small>
        </div>
      </div>

      <div className="footer-middle">
        {config.department}
        <br />
        {config.institution}
      </div>

      <div className="footer-copy">
        © 2026 DYNAMOZ. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}

/* =========================================================
   REGISTRATION
========================================================= */

function RegistrationPage({
  onBackHome,
  events,
  config,
  initialEventId,
}: {
  onBackHome: () => void;
  events: EventItem[];
  config: SiteConfig;
  initialEventId?: string;
}) {
  const [step, setStep] = useState(1);

  const [student, setStudent] =
    useState<StudentDetails>({
      fullName: "",
      registerNumber: "",
      department:
        "Computer Science and Engineering",
      year: "",
      email: "",
      phone: "",
    });

  const [selectedEvents, setSelectedEvents] =
    useState<string[]>(
      initialEventId ? [initialEventId] : []
    );

  const [teams, setTeams] = useState<
    Record<string, TeamDetails>
  >({});

  const [submittedRegistration, setSubmittedRegistration] =
    useState<Registration | null>(null);

  const activeEvents = events.filter(
    (event) => event.enabled
  );

  const teamEvents = selectedEvents
    .map((id) =>
      activeEvents.find(
        (event) => event.id === id
      )
    )
    .filter(
      (event): event is EventItem =>
        Boolean(
          event && event.mode === "team"
        )
    );

  const updateStudent = (
    field: keyof StudentDetails,
    value: string
  ) => {
    setStudent((current) => ({
      ...current,
      [field]: value,
    }));
  };

  useEffect(() => {
    const registerNumber = student.registerNumber.trim();
    if (!registerNumber) return;

    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from("students")
        .select("full_name, register_number, department, year, email, phone")
        .ilike("register_number", registerNumber)
        .maybeSingle();

      if (error) {
        console.error("Student lookup failed:", error);
        return;
      }

      if (!data) return;

      setStudent((current) => {
        if (current.registerNumber.trim().toLowerCase() !== registerNumber.toLowerCase()) {
          return current;
        }

        return {
          fullName: data.full_name ?? current.fullName,
          registerNumber: data.register_number ?? current.registerNumber,
          department: data.department ?? current.department,
          year: data.year ?? current.year,
          email: data.email ?? current.email,
          phone: data.phone ?? current.phone,
        };
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [student.registerNumber]);

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((current) => {
      if (current.includes(eventId)) {
        const next = current.filter(
          (id) => id !== eventId
        );

        setTeams((existing) => {
          const copy = {
            ...existing,
          };

          delete copy[eventId];

          return copy;
        });

        return next;
      }

      return [...current, eventId];
    });
  };

  const updateTeamName = (
    eventId: string,
    teamName: string
  ) => {
    const event = events.find(
      (item) => item.id === eventId
    );

    const teamSize = event?.teamSize || 4;

    setTeams((current) => ({
      ...current,
      [eventId]: {
        teamName,
        members:
          current[eventId]?.members ??
          Array.from(
            { length: teamSize },
            () => ({
              name: "",
              registerNumber: "",
            })
          ),
      },
    }));
  };

  const updateTeamMember = (
    eventId: string,
    index: number,
    field: keyof TeamMember,
    value: string
  ) => {
    setTeams((current) => {
      const event = events.find(
        (item) => item.id === eventId
      );

      const teamSize = event?.teamSize || 4;

      const existing =
        current[eventId] ?? {
          teamName: "",
          members: Array.from(
            { length: teamSize },
            () => ({
              name: "",
              registerNumber: "",
            })
          ),
        };

      const members = [
        ...existing.members,
      ];

      members[index] = {
        ...members[index],
        [field]: value,
      };

      return {
        ...current,
        [eventId]: {
          ...existing,
          members,
        },
      };
    });
  };

  const validateStepOne = () => {
    if (
      !student.fullName.trim() ||
      !student.registerNumber.trim() ||
      !student.department.trim() ||
      !student.year ||
      !student.email.trim() ||
      !student.phone.trim()
    ) {
      alert(
        "Please complete all student details."
      );

      return false;
    }

    return true;
  };

  const validateStepTwo = () => {
    if (selectedEvents.length === 0) {
      alert(
        "Please select at least one event."
      );

      return false;
    }

    return true;
  };

  const validateStepThree = () => {
    for (const event of teamEvents) {
      const team = teams[event.id];

      if (!team?.teamName.trim()) {
        alert(
          `Please enter the team name for ${event.name}.`
        );

        return false;
      }

      const hasEmptyMember =
        team.members.some(
          (member) =>
            !member.name.trim() ||
            !member.registerNumber.trim()
        );

      if (hasEmptyMember) {
        alert(
          `Please complete all team members for ${event.name}.`
        );

        return false;
      }
    }

    return true;
  };

  const handleContinue = () => {
    if (step === 1) {
      if (validateStepOne()) {
        setStep(2);
      }

      return;
    }

    if (step === 2) {
      if (validateStepTwo()) {
        if (teamEvents.length > 0) {
          setStep(3);
        } else {
          setStep(4);
        }
      }

      return;
    }

    if (step === 3) {
      if (validateStepThree()) {
        setStep(4);
      }
    }
  };

  const handleBack = () => {
    if (step === 1) {
      onBackHome();
      return;
    }

    if (
      step === 4 &&
      teamEvents.length === 0
    ) {
      setStep(2);
      return;
    }

    setStep((current) => current - 1);
  };

  const handleSubmit = async () => {
    if (
      !config.registrationEnabled ||
      isRegistrationDeadlinePassed(
        config.registrationDeadline
      )
    ) {
      alert(
        "Registration deadline has passed."
      );

      return;
    }

    if (!student.registerNumber.trim()) {
      alert("Please enter your register number.");
      return;
    }

    if (!student.fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (selectedEvents.length === 0) {
      alert("Please select at least one event.");
      return;
    }

    try {
      const registerNumber =
        student.registerNumber.trim();

      // 1. CHECK EXISTING STUDENT
      const {
        data: existingStudent,
        error: studentSearchError,
      } = await supabase
        .from("students")
        .select("*")
        .ilike(
          "register_number",
          registerNumber
        )
        .maybeSingle();

      if (studentSearchError) {
        console.error(
          studentSearchError
        );

        alert(
          "Unable to check student details."
        );

        return;
      }

      // 2. GET / CREATE STUDENT
      let studentId: string;

      if (existingStudent) {
        studentId = existingStudent.id;

        // Use latest cloud student details
        const cloudStudent: StudentDetails = {
          fullName:
            existingStudent.full_name ?? "",
          registerNumber:
            existingStudent.register_number ?? "",
          department:
            existingStudent.department ?? "",
          year:
            existingStudent.year ?? "",
          email:
            existingStudent.email ?? "",
          phone:
            existingStudent.phone ?? "",
        };

        setStudent(cloudStudent);
      } else {
        const {
          data: newStudent,
          error: studentInsertError,
        } = await supabase
          .from("students")
          .insert({
            register_number:
              registerNumber,
            full_name:
              student.fullName,
            department:
              student.department,
            year:
              student.year,
            email:
              student.email,
            phone:
              student.phone,
          })
          .select()
          .single();

        if (
          studentInsertError ||
          !newStudent
        ) {
          console.error(
            studentInsertError
          );

          alert(
            "Unable to save student details."
          );

          return;
        }

        studentId = newStudent.id;
      }

      // 3. CHECK PREVIOUS REGISTRATIONS
      const {
        data: previousRegistrations,
        error:
        registrationCheckError,
      } = await supabase
        .from("registrations")
        .select("selected_events")
        .eq(
          "student_id",
          studentId
        );

      if (registrationCheckError) {
        console.error(
          registrationCheckError
        );

        alert(
          "Unable to check previous registrations."
        );

        return;
      }

      // 4. FIND DUPLICATE EVENTS
      const alreadyRegisteredEvents =
        previousRegistrations
          ?.flatMap(
            (registration) =>
              Array.isArray(
                registration.selected_events
              )
                ? registration.selected_events
                : []
          )
          .filter((eventId) =>
            selectedEvents.includes(
              eventId
            )
          ) ?? [];

      if (
        alreadyRegisteredEvents.length > 0
      ) {
        const eventNames =
          alreadyRegisteredEvents
            .map(
              (eventId) =>
                events.find(
                  (event) =>
                    event.id === eventId
                )?.name ?? eventId
            )
            .join(", ");

        alert(
          `Already registered for: ${eventNames}`
        );

        return;
      }

      // 5. CREATE REGISTRATION ID
      const registrationId =
        generateRegistrationId();

      const createdAt =
        new Date().toISOString();

      // 6. SAVE TO SUPABASE
      const {
        error: registrationInsertError,
      } = await supabase
        .from("registrations")
        .insert({
          registration_id:
            registrationId,
          student_id:
            studentId,
          selected_events:
            selectedEvents,
          teams: teams,
          created_at:
            createdAt,
        });

      if (registrationInsertError) {
        console.error(
          registrationInsertError
        );

        alert(
          "Registration failed. Please try again."
        );

        return;
      }

      // 7. SUCCESS SCREEN
      const registration: Registration = {
        id: registrationId,
        student,
        selectedEvents,
        teams,
        createdAt,
      };

      saveRegistration(registration);

      setSubmittedRegistration(
        registration
      );

      setStep(5);

    } catch (error) {
      console.error(error);

      alert(
        "Something went wrong. Please try again."
      );
    }
  };

  if (submittedRegistration) {
    return (
      <div className="registration-page success-page">
        <div className="success-orb" />

        <div className="success-card">
          <div className="success-icon">
            ✓
          </div>

          <div className="registration-kicker">
            DYNAMOZ 26 / CONFIRMATION
          </div>

          <h1>
            REGISTRATION
            <br />
            <span>SUCCESSFUL</span>
          </h1>

          <p>
            Your registration has been successfully
            recorded. We look forward to seeing you
            at DYNAMOZ 26.
          </p>

          <div className="success-id">
            <span>REGISTRATION ID</span>
            <strong>
              {submittedRegistration.id}
            </strong>
          </div>

          <button
            className="primary-button full"
            onClick={onBackHome}
          >
            BACK TO HOME
            <span>↗</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-bg-grid" />

      <div className="registration-header">
        <button
          className="registration-logo"
          onClick={onBackHome}
        >
          <img
            src={DEmblem}
            alt="DYNAMOZ"
          />

          <span>
            {config.heroTitle}{" "}
            <b>{config.heroYear}</b>
          </span>
        </button>

        <div className="registration-header-text">
          {config.department}
          <br />
          {config.institution}
        </div>
      </div>

      <div className="registration-container">
        <div className="registration-top">
          <div>
            <div className="registration-kicker">
              DYNAMOZ 26 / REGISTRATION
            </div>

            <h1>
              REGISTER FOR{" "}
              <span>
                {config.heroTitle}
              </span>
            </h1>
          </div>

          <div className="step-counter">
            STEP {step} / 5
          </div>
        </div>

        <RegistrationProgress step={step} />

        <div className="registration-card">
          {step === 1 && (
            <StudentStep
              student={student}
              updateStudent={
                updateStudent
              }
            />
          )}

          {step === 2 && (
            <EventSelectionStep
              events={activeEvents}
              selectedEvents={
                selectedEvents
              }
              toggleEvent={
                toggleEvent
              }
            />
          )}

          {step === 3 && (
            <TeamDetailsStep
              teamEvents={teamEvents}
              teams={teams}
              updateTeamName={
                updateTeamName
              }
              updateTeamMember={
                updateTeamMember
              }
            />
          )}

          {step === 4 && (
            <ReviewStep
              events={events}
              student={student}
              selectedEvents={
                selectedEvents
              }
              teams={teams}
              onEditStep={setStep}
            />
          )}

          <div className="registration-actions">
            <button
              className="back-button"
              onClick={handleBack}
            >
              ← BACK
            </button>

            {step < 4 ? (
              <button
                className="primary-button"
                onClick={
                  handleContinue
                }
              >
                CONTINUE
                <span>→</span>
              </button>
            ) : (
              <button
                className="primary-button"
                onClick={handleSubmit}
              >
                CONFIRM REGISTRATION
                <span>↗</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REGISTRATION PROGRESS
========================================================= */

function RegistrationProgress({
  step,
}: {
  step: number;
}) {
  const labels = [
    "STUDENT",
    "EVENTS",
    "TEAM",
    "REVIEW",
    "DONE",
  ];

  return (
    <div className="registration-progress">
      {labels.map((label, index) => {
        const number = index + 1;

        return (
          <React.Fragment key={label}>
            <div
              className={`progress-step ${number <= step
                  ? "active"
                  : ""
                }`}
            >
              <span>
                {number
                  .toString()
                  .padStart(2, "0")}
              </span>

              <small>{label}</small>
            </div>

            {index <
              labels.length - 1 && (
                <div
                  className={`progress-line ${number < step
                      ? "active"
                      : ""
                    }`}
                />
              )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* =========================================================
   STEP 1
========================================================= */

function StudentStep({
  student,
  updateStudent,
}: {
  student: StudentDetails;
  updateStudent: (
    field: keyof StudentDetails,
    value: string
  ) => void;
}) {
  return (
    <div className="form-step">
      <div className="form-heading">
        <div className="form-step-number">
          01
        </div>

        <div>
          <h2>
            STUDENT DETAILS
          </h2>

          <p>
            Enter your details to begin
            your registration.
          </p>
        </div>
      </div>

      <div className="form-grid">
        <FormField
          label="FULL NAME"
          value={student.fullName}
          onChange={(value) =>
            updateStudent(
              "fullName",
              value
            )
          }
          placeholder="Enter your full name"
        />

        <FormField
          label="REGISTER NUMBER"
          value={
            student.registerNumber
          }
          onChange={(value) =>
            updateStudent(
              "registerNumber",
              value
            )
          }
          placeholder="Enter register number"
        />

        <FormField
          label="DEPARTMENT"
          value={student.department}
          onChange={(value) =>
            updateStudent(
              "department",
              value
            )
          }
          placeholder="Select department"
          options={DEPARTMENT_OPTIONS}
        />

        <div className="form-field">
          <label>YEAR</label>

          <select
            value={student.year}
            onChange={(event) =>
              updateStudent(
                "year",
                event.target.value
              )
            }
          >
            <option value="">
              Select year
            </option>

            <option value="1st Year">
              1st Year
            </option>

            <option value="2nd Year">
              2nd Year
            </option>

            <option value="3rd Year">
              3rd Year
            </option>

            <option value="4th Year">
              4th Year
            </option>
          </select>
        </div>

        <FormField
          label="EMAIL ADDRESS"
          type="email"
          value={student.email}
          onChange={(value) =>
            updateStudent(
              "email",
              value
            )
          }
          placeholder="you@example.com"
        />

        <FormField
          label="PHONE NUMBER"
          type="tel"
          value={student.phone}
          onChange={(value) =>
            updateStudent(
              "phone",
              value
            )
          }
          placeholder="Enter phone number"
        />
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  options?: { label: string; value: string }[];
}) {
  return (
    <div className="form-field">
      <label>{label}</label>

      {options ? (
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   STEP 2
========================================================= */

function EventSelectionStep({
  events,
  selectedEvents,
  toggleEvent,
}: {
  events: EventItem[];
  selectedEvents: string[];
  toggleEvent: (
    eventId: string
  ) => void;
}) {
  const technicalEvents =
    events.filter(
      (event) =>
        event.category === "technical"
    );

  const nonTechnicalEvents =
    events.filter(
      (event) =>
        event.category ===
        "non-technical"
    );

  return (
    <div className="form-step">
      <div className="form-heading">
        <div className="form-step-number">
          02
        </div>

        <div>
          <h2>
            SELECT EVENTS
          </h2>

          <p>
            Choose one or more events
            you want to participate in.
          </p>
        </div>
      </div>

      <EventSelectionGroup
        title="TECHNICAL EVENTS"
        events={technicalEvents}
        selectedEvents={
          selectedEvents
        }
        toggleEvent={toggleEvent}
      />

      <EventSelectionGroup
        title="NON-TECHNICAL EVENTS"
        events={nonTechnicalEvents}
        selectedEvents={
          selectedEvents
        }
        toggleEvent={toggleEvent}
      />
    </div>
  );
}

function EventSelectionGroup({
  title,
  events,
  selectedEvents,
  toggleEvent,
}: {
  title: string;
  events: EventItem[];
  selectedEvents: string[];
  toggleEvent: (
    eventId: string
  ) => void;
}) {
  return (
    <div className="selection-group">
      <div className="selection-group-title">
        <span />
        {title}
      </div>

      <div className="registration-event-grid">
        {events.map((event) => {
          const selected =
            selectedEvents.includes(
              event.id
            );

          return (
            <button
              key={event.id}
              className={`registration-event ${selected
                  ? "selected"
                  : ""
                }`}
              onClick={() =>
                toggleEvent(event.id)
              }
            >
              <div className={`registration-event-poster ${event.posterImage ? "has-poster-image" : ""}`}>
                {event.posterImage ? (
                  <img src={event.posterImage} alt={`${event.name} poster`} />
                ) : (
                  <span>{event.poster}</span>
                )}

                {selected && (
                  <div className="selected-check">
                    ✓
                  </div>
                )}
              </div>

              <div className="registration-event-info">
                <div className="registration-event-type">
                  {event.mode ===
                    "team"
                    ? `TEAM · ${event.teamSize}`
                    : "INDIVIDUAL"}
                </div>

                <h3>
                  {event.name}
                </h3>

                <p>
                  {event.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   STEP 3
========================================================= */

function TeamDetailsStep({
  teamEvents,
  teams,
  updateTeamName,
  updateTeamMember,
}: {
  teamEvents: EventItem[];
  teams: Record<
    string,
    TeamDetails
  >;
  updateTeamName: (
    eventId: string,
    name: string
  ) => void;
  updateTeamMember: (
    eventId: string,
    index: number,
    field: keyof TeamMember,
    value: string
  ) => void;
}) {
  return (
    <div className="form-step">
      <div className="form-heading">
        <div className="form-step-number">
          03
        </div>

        <div>
          <h2>
            TEAM DETAILS
          </h2>

          <p>
            Add team details for each
            team event you selected.
          </p>
        </div>
      </div>

      <div className="team-event-sections">
        {teamEvents.map((event) => {
          const team =
            teams[event.id] ?? {
              teamName: "",
              members:
                Array.from(
                  {
                    length:
                      event.teamSize ||
                      4,
                  },
                  () => ({
                    name: "",
                    registerNumber:
                      "",
                  })
                ),
            };

          return (
            <div
              className="team-event-card"
              key={event.id}
            >
              <div className="team-event-header">
                <div>
                  <span>
                    TEAM EVENT
                  </span>

                  <h3>
                    {event.name}
                  </h3>
                </div>

                <strong>
                  {team.members.length
                    .toString()
                    .padStart(2, "0")}
                </strong>
              </div>

              <div className="team-name-field">
                <label>
                  TEAM NAME
                </label>

                <input
                  type="text"
                  value={
                    team.teamName
                  }
                  placeholder={`Enter team name for ${event.name}`}
                  onChange={(
                    inputEvent
                  ) =>
                    updateTeamName(
                      event.id,
                      inputEvent
                        .target
                        .value
                    )
                  }
                />
              </div>

              <div className="members-title">
                TEAM MEMBERS
              </div>

              <div className="members-table">
                <div className="member-table-head">
                  <span>
                    NO.
                  </span>

                  <span>
                    MEMBER NAME
                  </span>

                  <span>
                    REGISTER NUMBER
                  </span>
                </div>

                {team.members.map(
                  (
                    member,
                    index
                  ) => (
                    <div
                      className="member-row"
                      key={`${event.id}-${index}`}
                    >
                      <span className="member-number">
                        {(
                          index + 1
                        )
                          .toString()
                          .padStart(
                            2,
                            "0"
                          )}
                      </span>

                      <input
                        type="text"
                        value={
                          member.name
                        }
                        placeholder="Member name"
                        onChange={(
                          inputEvent
                        ) =>
                          updateTeamMember(
                            event.id,
                            index,
                            "name",
                            inputEvent
                              .target
                              .value
                          )
                        }
                      />

                      <input
                        type="text"
                        value={
                          member.registerNumber
                        }
                        placeholder="Register number"
                        onChange={(
                          inputEvent
                        ) =>
                          updateTeamMember(
                            event.id,
                            index,
                            "registerNumber",
                            inputEvent
                              .target
                              .value
                          )
                        }
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   STEP 4
========================================================= */

function ReviewStep({
  events,
  student,
  selectedEvents,
  teams,
  onEditStep,
}: {
  events: EventItem[];
  student: StudentDetails;
  selectedEvents: string[];
  teams: Record<
    string,
    TeamDetails
  >;
  onEditStep: (
    step: number
  ) => void;
}) {
  return (
    <div className="form-step">
      <div className="form-heading">
        <div className="form-step-number">
          04
        </div>

        <div>
          <h2>REVIEW</h2>

          <p>
            Check your details before
            confirming registration.
          </p>
        </div>
      </div>

      <div className="review-section">
        <div className="review-header">
          <span>
            STUDENT DETAILS
          </span>

          <button
            onClick={() =>
              onEditStep(1)
            }
          >
            EDIT
          </button>
        </div>

        <div className="review-grid">
          <ReviewItem
            label="NAME"
            value={
              student.fullName
            }
          />

          <ReviewItem
            label="REGISTER NUMBER"
            value={
              student.registerNumber
            }
          />

          <ReviewItem
            label="DEPARTMENT"
            value={
              student.department
            }
          />

          <ReviewItem
            label="YEAR"
            value={student.year}
          />

          <ReviewItem
            label="EMAIL"
            value={student.email}
          />

          <ReviewItem
            label="PHONE"
            value={student.phone}
          />
        </div>
      </div>

      <div className="review-section">
        <div className="review-header">
          <span>
            SELECTED EVENTS
          </span>

          <button
            onClick={() =>
              onEditStep(2)
            }
          >
            EDIT
          </button>
        </div>

        <div className="review-events">
          {selectedEvents.map(
            (
              eventId,
              index
            ) => {
              const event =
                events.find(
                  (item) =>
                    item.id ===
                    eventId
                );

              if (!event)
                return null;

              return (
                <div
                  className="review-event"
                  key={event.id}
                >
                  <span>
                    {(index + 1)
                      .toString()
                      .padStart(
                        2,
                        "0"
                      )}
                  </span>

                  <strong>
                    {event.name}
                  </strong>

                  <small>
                    {event.mode ===
                      "team"
                      ? "TEAM"
                      : "INDIVIDUAL"}
                  </small>
                </div>
              );
            }
          )}
        </div>
      </div>

      {Object.keys(teams).length >
        0 && (
          <div className="review-section">
            <div className="review-header">
              <span>
                TEAM DETAILS
              </span>

              <button
                onClick={() =>
                  onEditStep(3)
                }
              >
                EDIT
              </button>
            </div>

            <div className="review-teams">
              {Object.entries(
                teams
              ).map(
                ([
                  eventId,
                  team,
                ]) => {
                  const event =
                    events.find(
                      (item) =>
                        item.id ===
                        eventId
                    );

                  if (!event)
                    return null;

                  return (
                    <div
                      className="review-team"
                      key={eventId}
                    >
                      <div className="review-team-title">
                        <strong>
                          {event.name}
                        </strong>

                        <span>
                          {
                            team.teamName
                          }
                        </span>
                      </div>

                      {team.members.map(
                        (
                          member,
                          index
                        ) => (
                          <div
                            className="review-member"
                            key={`${eventId}-${index}`}
                          >
                            <span>
                              {(
                                index + 1
                              )
                                .toString()
                                .padStart(
                                  2,
                                  "0"
                                )}
                            </span>

                            <strong>
                              {
                                member.name
                              }
                            </strong>

                            <small>
                              {
                                member.registerNumber
                              }
                            </small>
                          </div>
                        )
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
    </div>
  );
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="review-item">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   ADMIN LOGIN
========================================================= */

function AdminLogin({
  onLogin,
}: {
  onLogin: () => void;
}) {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const login = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (
      username === "admin" &&
      password === "dynamoz26"
    ) {
      localStorage.setItem(
        "dynamoz26_admin_auth",
        "true"
      );

      onLogin();
    } else {
      alert(
        "Invalid username or password."
      );
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <img
          src={DEmblem}
          alt="DYNAMOZ"
        />

        <div className="registration-kicker">
          DYNAMOZ 26 / RESTRICTED ACCESS
        </div>

        <h1>
          ADMIN
          <br />
          <span>PORTAL</span>
        </h1>

        <form onSubmit={login}>
          <div className="form-field">
            <label>
              USERNAME
            </label>

            <input
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
              placeholder="Enter username"
            />
          </div>

          <div className="form-field">
            <label>
              PASSWORD
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter password"
            />
          </div>

          <button
            className="primary-button full"
            type="submit"
          >
            LOGIN
            <span>↗</span>
          </button>
        </form>

        <div className="admin-login-hint">
          ADMIN ACCESS
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

type AdminTab =
  | "dashboard"
  | "website"
  | "events"
  | "registrations";

function AdminPage({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [tab, setTab] =
    useState<AdminTab>(
      "dashboard"
    );

  const [events, setEvents] =
    useState<EventItem[]>(
      getStoredEvents()
    );

  const [config, setConfig] =
    useState<SiteConfig>(
      getStoredConfig()
    );

  const [registrations, setRegistrations] =
    useState<Registration[]>(
      getStoredRegistrations()
    );

  const [selectedEventId, setSelectedEventId] =
    useState(
      getStoredEvents()[0]?.id ??
      ""
    );

  const selectedEvent =
    events.find(
      (event) =>
        event.id ===
        selectedEventId
    ) ?? events[0];

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const refreshRegistrations = async () => {
    try {
      const cloudRegistrations = await fetchCloudRegistrations();
      setRegistrations(cloudRegistrations);

      // Keep a local cache so the admin UI still has data if the network
      // briefly disappears after a successful cloud fetch.
      localStorage.setItem(
        REGISTRATIONS_KEY,
        JSON.stringify(cloudRegistrations)
      );
    } catch (error) {
      console.error("Unable to load cloud registrations:", error);
      setRegistrations(getStoredRegistrations());
      alert("Unable to load cloud registrations. Showing the local cache.");
    }
  };

  useEffect(() => {
    void refreshRegistrations();
  }, []);

  const updateConfig = <
    K extends keyof SiteConfig
  >(
    field: K,
    value: SiteConfig[K]
  ) => {
    setConfig((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateEvent = (
    eventId: string,
    updates: Partial<EventItem>
  ) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
            ...event,
            ...updates,
          }
          : event
      )
    );
  };

  const addEvent = () => {
    const newEvent: EventItem = {
      id: generateId("event"),
      name: "NEW EVENT",
      category: "technical",
      mode: "individual",
      description:
        "Add event description here.",
      poster: "NEW",
      teamSize: 1,
      rules:
        "Add event rules here.",
      eligibility:
        "Add eligibility details here.",
      prize:
        "Add prize details here.",
      enabled: true,
      rounds: [],
    };

    setEvents((current) => [
      ...current,
      newEvent,
    ]);

    setSelectedEventId(
      newEvent.id
    );

    setTab("events");
  };

  const deleteEvent = (
    eventId: string
  ) => {
    const event =
      events.find(
        (item) =>
          item.id === eventId
      );

    if (!event) return;

    const confirmed =
      window.confirm(
        `Delete "${event.name}"? This cannot be undone.`
      );

    if (!confirmed) return;

    const remaining =
      events.filter(
        (item) =>
          item.id !== eventId
      );

    setEvents(remaining);

    setSelectedEventId(
      remaining[0]?.id ?? ""
    );
  };

  const addRound = () => {
    if (!selectedEvent)
      return;

    const round: EventRound = {
      id: generateId("round"),
      name: `ROUND ${selectedEvent.rounds.length +
        1
        }`,
      description:
        "Add round description.",
      date: "2026-09-10",
      startTime: "10:00",
      endTime: "11:00",
      venue: "Venue TBA",
      mode: "Offline",
    };

    updateEvent(
      selectedEvent.id,
      {
        rounds: [
          ...selectedEvent.rounds,
          round,
        ],
      }
    );
  };

  const updateRound = (
    roundId: string,
    updates: Partial<EventRound>
  ) => {
    if (!selectedEvent)
      return;

    updateEvent(
      selectedEvent.id,
      {
        rounds:
          selectedEvent.rounds.map(
            (round) =>
              round.id ===
                roundId
                ? {
                  ...round,
                  ...updates,
                }
                : round
          ),
      }
    );
  };

  const deleteRound = (
    roundId: string
  ) => {
    if (!selectedEvent)
      return;

    updateEvent(
      selectedEvent.id,
      {
        rounds:
          selectedEvent.rounds.filter(
            (round) =>
              round.id !==
              roundId
          ),
      }
    );
  };

  const logout = () => {
    localStorage.removeItem(
      "dynamoz26_admin_auth"
    );

    onLogout();
  };

  if (!selectedEvent && tab === "events") {
    return (
      <div className="admin-page">
        <AdminSidebar
          tab={tab}
          setTab={setTab}
          onLogout={logout}
        />

        <main className="admin-main">
          <AdminEmptyEvents
            onAdd={addEvent}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar
        tab={tab}
        setTab={setTab}
        onLogout={logout}
      />

      <main className="admin-main">
        {tab === "dashboard" && (
          <AdminDashboard
            config={config}
            events={events}
            registrations={
              registrations
            }
            onRefresh={
              refreshRegistrations
            }
          />
        )}

        {tab === "website" && (
          <WebsiteEditor
            config={config}
            updateConfig={
              updateConfig
            }
          />
        )}

        {tab === "events" && (
          <EventEditor
            events={events}
            selectedEvent={
              selectedEvent
            }
            selectedEventId={
              selectedEventId
            }
            setSelectedEventId={
              setSelectedEventId
            }
            updateEvent={
              updateEvent
            }
            addEvent={addEvent}
            deleteEvent={
              deleteEvent
            }
            addRound={addRound}
            updateRound={
              updateRound
            }
            deleteRound={
              deleteRound
            }
          />
        )}

        {tab === "registrations" && (
          <RegistrationManager
            events={events}
            registrations={
              registrations
            }
            refresh={
              refreshRegistrations
            }
          />
        )}
      </main>
    </div>
  );
}

/* =========================================================
   ADMIN SIDEBAR
========================================================= */

function AdminSidebar({
  tab,
  setTab,
  onLogout,
}: {
  tab: AdminTab;
  setTab: (
    tab: AdminTab
  ) => void;
  onLogout: () => void;
}) {
  const items: {
    id: AdminTab;
    label: string;
    icon: string;
  }[] = [
      {
        id: "dashboard",
        label: "DASHBOARD",
        icon: "⌂",
      },
      {
        id: "website",
        label: "WEBSITE EDITOR",
        icon: "✎",
      },
      {
        id: "events",
        label: "EVENT MANAGEMENT",
        icon: "◆",
      },
      {
        id: "registrations",
        label: "REGISTRATIONS",
        icon: "▣",
      },
    ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-logo">
        <img
          src={DEmblem}
          alt="DYNAMOZ"
        />

        <strong>
          DYNAMOZ{" "}
          <span>26</span>
        </strong>
      </div>

      <div className="admin-sidebar-label">
        CONTROL CENTER
      </div>

      {items.map((item) => (
        <button
          key={item.id}
          className={
            tab === item.id
              ? "active"
              : ""
          }
          onClick={() =>
            setTab(item.id)
          }
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}

      <div className="admin-sidebar-footer">
        <small>
          DYNAMOZ 26 ADMIN
        </small>

        <small>
          DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
        </small>

        <button
          className="admin-logout"
          onClick={onLogout}
        >
          ↪ LOGOUT
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard({
  config,
  events,
  registrations,
  onRefresh,
}: {
  config: SiteConfig;
  events: EventItem[];
  registrations: Registration[];
  onRefresh: () => void;
}) {
  const registrationClosed =
    !config.registrationEnabled ||
    isRegistrationDeadlinePassed(
      config.registrationDeadline
    );

  const eventCounts = events.map(
    (event) => ({
      event,
      count: registrations.filter(
        (registration) =>
          registration.selectedEvents.includes(
            event.id
          )
      ).length,
    })
  );

  return (
    <div className="admin-dashboard">
      <AdminTopbar
        eyebrow="DYNAMOZ 26 / ADMIN"
        title="CONTROL CENTER"
        action={
          <button
            className="admin-refresh"
            onClick={onRefresh}
          >
            ↻ REFRESH
          </button>
        }
      />

      <div className="admin-stats">
        <div>
          <span>
            TOTAL REGISTRATIONS
          </span>

          <strong>
            {registrations.length}
          </strong>
        </div>

        <div>
          <span>
            ACTIVE EVENTS
          </span>

          <strong>
            {
              events.filter(
                (event) =>
                  event.enabled
              ).length
            }
          </strong>
        </div>

        <div>
          <span>
            REGISTRATION STATUS
          </span>

          <strong>
            {registrationClosed
              ? "CLOSED"
              : "OPEN"}
          </strong>
        </div>

        <div>
          <span>
            DEADLINE
          </span>

          <strong>
            {formatDate(
              config.registrationDeadline
            )}
          </strong>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <span>
                EVENT PERFORMANCE
              </span>

              <h2>
                REGISTRATIONS BY EVENT
              </h2>
            </div>
          </div>

          <div className="admin-event-list">
            {eventCounts.map(
              ({
                event,
                count,
              }) => (
                <div
                  className="admin-event-list-row"
                  key={event.id}
                >
                  <div>
                    <strong>
                      {event.name}
                    </strong>

                    <small>
                      {event.category.toUpperCase()}{" "}
                      ·{" "}
                      {event.mode.toUpperCase()}
                    </small>
                  </div>

                  <strong>
                    {count}
                  </strong>
                </div>
              )
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <span>
                EVENT INFORMATION
              </span>

              <h2>
                CURRENT SETTINGS
              </h2>
            </div>
          </div>

          <div className="admin-info-list">
            <div>
              <span>
                EVENT DATE
              </span>

              <strong>
                {formatDate(
                  config.eventDate
                )}
              </strong>
            </div>

            <div>
              <span>
                REGISTRATION DEADLINE
              </span>

              <strong>
                {formatDate(
                  config.registrationDeadline
                )}
              </strong>
            </div>

            <div>
              <span>
                DEPARTMENT
              </span>

              <strong>
                {config.department}
              </strong>
            </div>

            <div>
              <span>
                INSTITUTION
              </span>

              <strong>
                {config.institution}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <span>
              RECENT ACTIVITY
            </span>

            <h2>
              LATEST REGISTRATIONS
            </h2>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  REG ID
                </th>

                <th>
                  NAME
                </th>

                <th>
                  REGISTER NUMBER
                </th>

                <th>
                  EVENTS
                </th>

                <th>
                  REGISTERED AT
                </th>
              </tr>
            </thead>

            <tbody>
              {registrations
                .slice(-10)
                .reverse()
                .map(
                  (
                    registration
                  ) => (
                    <tr
                      key={
                        registration.id
                      }
                    >
                      <td>
                        {
                          registration.id
                        }
                      </td>

                      <td>
                        {
                          registration
                            .student
                            .fullName
                        }
                      </td>

                      <td>
                        {
                          registration
                            .student
                            .registerNumber
                        }
                      </td>

                      <td>
                        {
                          registration
                            .selectedEvents
                            .length
                        }
                      </td>

                      <td>
                        {new Date(
                          registration.createdAt
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>
                    </tr>
                  )
                )}

              {registrations.length ===
                0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="empty-admin"
                    >
                      NO REGISTRATIONS YET
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN TOPBAR
========================================================= */

function AdminTopbar({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-topbar">
      <div>
        <div className="registration-kicker">
          {eyebrow}
        </div>

        <h1>{title}</h1>
      </div>

      {action}
    </div>
  );
}

/* =========================================================
   WEBSITE EDITOR
========================================================= */

function WebsiteEditor({
  config,
  updateConfig,
}: {
  config: SiteConfig;
  updateConfig: <
    K extends keyof SiteConfig
  >(
    field: K,
    value: SiteConfig[K]
  ) => void;
}) {
  const updatePerson = (
    id: string,
    updates: Partial<Person>
  ) => {
    updateConfig(
      "people",
      config.people.map(
        (person) =>
          person.id === id
            ? {
              ...person,
              ...updates,
            }
            : person
      )
    );
  };

  const addPerson = () => {
    updateConfig(
      "people",
      [
        ...config.people,
        {
          id: generateId("person"),
          role: "NEW ROLE",
          name: "New Person",
          initials: "NP",
          description:
            "Add person description.",
        },
      ]
    );
  };

  const deletePerson = (
    id: string
  ) => {
    updateConfig(
      "people",
      config.people.filter(
        (person) =>
          person.id !== id
      )
    );
  };

  return (
    <div className="admin-editor">
      <AdminTopbar
        eyebrow="DYNAMOZ 26 / WEBSITE"
        title="WEBSITE EDITOR"
      />

      <div className="admin-save-banner">
        <span>
          ✓ CHANGES ARE SAVED AUTOMATICALLY
        </span>

        <small>
          Edit the fields below. Public website updates instantly.
        </small>
      </div>

      <AdminEditorSection
        number="01"
        title="HERO SECTION"
        subtitle="Edit the main landing page content."
      >
        <div className="admin-form-grid">
          <AdminInput
            label="WELCOME TEXT"
            value={
              config.heroWelcome
            }
            onChange={(value) =>
              updateConfig(
                "heroWelcome",
                value
              )
            }
          />

          <AdminInput
            label="MAIN TITLE"
            value={
              config.heroTitle
            }
            onChange={(value) =>
              updateConfig(
                "heroTitle",
                value
              )
            }
          />

          <AdminInput
            label="YEAR"
            value={
              config.heroYear
            }
            onChange={(value) =>
              updateConfig(
                "heroYear",
                value
              )
            }
          />

          <AdminInput
            label="TAGLINE 1"
            value={
              config.heroTaglineOne
            }
            onChange={(value) =>
              updateConfig(
                "heroTaglineOne",
                value
              )
            }
          />

          <AdminInput
            label="TAGLINE 2"
            value={
              config.heroTaglineTwo
            }
            onChange={(value) =>
              updateConfig(
                "heroTaglineTwo",
                value
              )
            }
          />

          <AdminInput
            label="TAGLINE 3"
            value={
              config.heroTaglineThree
            }
            onChange={(value) =>
              updateConfig(
                "heroTaglineThree",
                value
              )
            }
          />
        </div>
      </AdminEditorSection>

      <AdminEditorSection
        number="02"
        title="EVENT & REGISTRATION SETTINGS"
        subtitle="Control event date and registration availability."
      >
        <div className="admin-form-grid">
          <AdminInput
            label="EVENT DATE & TIME"
            type="datetime-local"
            value={
              config.eventDate
            }
            onChange={(value) =>
              updateConfig(
                "eventDate",
                value
              )
            }
          />

          <AdminInput
            label="REGISTRATION DEADLINE"
            type="datetime-local"
            value={
              config.registrationDeadline
            }
            onChange={(value) =>
              updateConfig(
                "registrationDeadline",
                value
              )
            }
          />
        </div>

        <div className="admin-toggle-row">
          <div>
            <strong>
              REGISTRATION ENABLED
            </strong>

            <small>
              Manually open or close registrations.
            </small>
          </div>

          <button
            className={`admin-toggle ${config.registrationEnabled
                ? "active"
                : ""
              }`}
            onClick={() =>
              updateConfig(
                "registrationEnabled",
                !config.registrationEnabled
              )
            }
          >
            <span />
          </button>
        </div>

        <div className="admin-deadline-preview">
          <span>
            CURRENT STATUS
          </span>

          <strong>
            {!config.registrationEnabled
              ? "CLOSED BY ADMIN"
              : isRegistrationDeadlinePassed(
                config.registrationDeadline
              )
                ? "CLOSED — DEADLINE PASSED"
                : "OPEN — ACCEPTING REGISTRATIONS"}
          </strong>
        </div>
      </AdminEditorSection>

      <AdminEditorSection
        number="03"
        title="ABOUT SECTION"
        subtitle="Edit the public About content."
      >
        <AdminTextarea
          label="SUBTITLE"
          value={
            config.aboutSubtitle
          }
          onChange={(value) =>
            updateConfig(
              "aboutSubtitle",
              value
            )
          }
        />

        <AdminTextarea
          label="LEAD CONTENT"
          value={
            config.aboutLead
          }
          onChange={(value) =>
            updateConfig(
              "aboutLead",
              value
            )
          }
        />

        <AdminTextarea
          label="DESCRIPTION"
          value={
            config.aboutDescription
          }
          onChange={(value) =>
            updateConfig(
              "aboutDescription",
              value
            )
          }
        />

        <div className="admin-form-grid">
          <AdminInput
            label="DEPARTMENT"
            value={
              config.department
            }
            onChange={(value) =>
              updateConfig(
                "department",
                value
              )
            }
          />

          <AdminInput
            label="INSTITUTION"
            value={
              config.institution
            }
            onChange={(value) =>
              updateConfig(
                "institution",
                value
              )
            }
          />
        </div>
      </AdminEditorSection>

      <AdminEditorSection
        number="04"
        title="PEOPLE / TEAM"
        subtitle="Add or edit the people displayed on the website."
      >
        <div className="admin-people-editor">
          {config.people.map(
            (person) => (
              <div
                className="admin-person-editor"
                key={person.id}
              >
                <div className="admin-person-editor-top">
                  <strong>
                    {person.name}
                  </strong>

                  <button
                    className="admin-danger-button"
                    onClick={() =>
                      deletePerson(
                        person.id
                      )
                    }
                  >
                    DELETE
                  </button>
                </div>

                <div className="admin-form-grid">
                  <AdminInput
                    label="ROLE"
                    value={
                      person.role
                    }
                    onChange={(value) =>
                      updatePerson(
                        person.id,
                        {
                          role: value,
                        }
                      )
                    }
                  />

                  <AdminInput
                    label="NAME"
                    value={
                      person.name
                    }
                    onChange={(value) =>
                      updatePerson(
                        person.id,
                        {
                          name: value,
                        }
                      )
                    }
                  />

                  <AdminInput
                    label="INITIALS"
                    value={
                      person.initials
                    }
                    onChange={(value) =>
                      updatePerson(
                        person.id,
                        {
                          initials:
                            value,
                        }
                      )
                    }
                  />
                </div>

                <AdminTextarea
                  label="DESCRIPTION"
                  value={
                    person.description
                  }
                  onChange={(value) =>
                    updatePerson(
                      person.id,
                      {
                        description:
                          value,
                      }
                    )
                  }
                />
              </div>
            )
          )}
        </div>

        <button
          className="admin-secondary-button"
          onClick={addPerson}
        >
          + ADD PERSON
        </button>
      </AdminEditorSection>

      <AdminEditorSection
        number="05"
        title="CONTACT"
        subtitle="Edit contact information."
      >
        <div className="admin-form-grid">
          <AdminInput
            label="DEPARTMENT"
            value={
              config.contactDepartment
            }
            onChange={(value) =>
              updateConfig(
                "contactDepartment",
                value
              )
            }
          />

          <AdminInput
            label="INSTITUTION"
            value={
              config.contactInstitution
            }
            onChange={(value) =>
              updateConfig(
                "contactInstitution",
                value
              )
            }
          />

          <AdminInput
            label="EMAIL"
            value={
              config.contactEmail
            }
            onChange={(value) =>
              updateConfig(
                "contactEmail",
                value
              )
            }
          />

          <AdminInput
            label="LOCATION"
            value={
              config.contactLocation
            }
            onChange={(value) =>
              updateConfig(
                "contactLocation",
                value
              )
            }
          />
        </div>
      </AdminEditorSection>

      <AdminEditorSection
        number="06"
        title="SOCIAL LINKS"
        subtitle="Update your social media links."
      >
        <div className="admin-form-grid">
          <AdminInput
            label="INSTAGRAM URL"
            value={
              config.instagram
            }
            onChange={(value) =>
              updateConfig(
                "instagram",
                value
              )
            }
          />

          <AdminInput
            label="LINKEDIN URL"
            value={
              config.linkedin
            }
            onChange={(value) =>
              updateConfig(
                "linkedin",
                value
              )
            }
          />

          <AdminInput
            label="YOUTUBE URL"
            value={
              config.youtube
            }
            onChange={(value) =>
              updateConfig(
                "youtube",
                value
              )
            }
          />

          <AdminInput
            label="X URL"
            value={config.x}
            onChange={(value) =>
              updateConfig(
                "x",
                value
              )
            }
          />
        </div>
      </AdminEditorSection>
    </div>
  );
}

/* =========================================================
   ADMIN EVENT EDITOR
========================================================= */

function EventEditor({
  events,
  selectedEvent,
  selectedEventId,
  setSelectedEventId,
  updateEvent,
  addEvent,
  deleteEvent,
  addRound,
  updateRound,
  deleteRound,
}: {
  events: EventItem[];
  selectedEvent?: EventItem;
  selectedEventId: string;
  setSelectedEventId: (
    id: string
  ) => void;
  updateEvent: (
    id: string,
    updates: Partial<EventItem>
  ) => void;
  addEvent: () => void;
  deleteEvent: (
    id: string
  ) => void;
  addRound: () => void;
  updateRound: (
    id: string,
    updates: Partial<EventRound>
  ) => void;
  deleteRound: (
    id: string
  ) => void;
}) {
  return (
    <div className="admin-editor">
      <AdminTopbar
        eyebrow="DYNAMOZ 26 / EVENTS"
        title="EVENT MANAGEMENT"
        action={
          <button
            className="primary-button"
            onClick={addEvent}
          >
            + ADD EVENT
          </button>
        }
      />

      <div className="admin-event-editor-layout">
        <aside className="admin-event-list-sidebar">
          <div className="admin-sidebar-label">
            ALL EVENTS
          </div>

          {events.map((event) => (
            <button
              key={event.id}
              className={
                selectedEventId ===
                  event.id
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedEventId(
                  event.id
                )
              }
            >
              <span>
                {event.category ===
                  "technical"
                  ? "TECH"
                  : "NON"}
              </span>

              <div>
                <strong>
                  {event.name}
                </strong>

                <small>
                  {event.mode ===
                    "team"
                    ? `TEAM · ${event.teamSize}`
                    : "INDIVIDUAL"}
                </small>
              </div>

              {!event.enabled && (
                <em>
                  HIDDEN
                </em>
              )}
            </button>
          ))}
        </aside>

        <div className="admin-event-editor">
          {!selectedEvent ? (
            <AdminEmptyEvents
              onAdd={addEvent}
            />
          ) : (
            <>
              <div className="admin-event-editor-heading">
                <div>
                  <span>
                    EVENT EDITOR
                  </span>

                  <h2>
                    {selectedEvent.name}
                  </h2>
                </div>

                <button
                  className="admin-danger-button"
                  onClick={() =>
                    deleteEvent(
                      selectedEvent.id
                    )
                  }
                >
                  DELETE EVENT
                </button>
              </div>

              <AdminEditorSection
                number="01"
                title="BASIC INFORMATION"
                subtitle="Everything displayed on the event card and details modal."
              >
                <div className="admin-form-grid">
                  <AdminInput
                    label="EVENT NAME"
                    value={
                      selectedEvent.name
                    }
                    onChange={(value) =>
                      updateEvent(
                        selectedEvent.id,
                        {
                          name: value,
                        }
                      )
                    }
                  />

                  <AdminInput
                    label="POSTER TEXT"
                    value={
                      selectedEvent.poster
                    }
                    onChange={(value) =>
                      updateEvent(
                        selectedEvent.id,
                        {
                          poster: value,
                        }
                      )
                    }
                  />

                  <AdminPosterUpload
                    value={selectedEvent.posterImage}
                    onChange={(value) =>
                      updateEvent(
                        selectedEvent.id,
                        { posterImage: value }
                      )
                    }
                  />

                  <AdminSelect
                    label="CATEGORY"
                    value={
                      selectedEvent.category
                    }
                    options={[
                      {
                        label:
                          "Technical",
                        value:
                          "technical",
                      },
                      {
                        label:
                          "Non-Technical",
                        value:
                          "non-technical",
                      },
                    ]}
                    onChange={(value) =>
                      updateEvent(
                        selectedEvent.id,
                        {
                          category:
                            value as EventCategory,
                        }
                      )
                    }
                  />

                  <AdminSelect
                    label="EVENT MODE"
                    value={
                      selectedEvent.mode
                    }
                    options={[
                      {
                        label:
                          "Individual",
                        value:
                          "individual",
                      },
                      {
                        label:
                          "Team",
                        value:
                          "team",
                      },
                    ]}
                    onChange={(value) =>
                      updateEvent(
                        selectedEvent.id,
                        {
                          mode:
                            value as EventMode,
                          teamSize:
                            value ===
                              "team"
                              ? Math.max(
                                2,
                                selectedEvent.teamSize ||
                                4
                              )
                              : 1,
                        }
                      )
                    }
                  />

                  {selectedEvent.mode ===
                    "team" && (
                      <AdminInput
                        label="MAX TEAM SIZE"
                        type="number"
                        value={String(
                          selectedEvent.teamSize
                        )}
                        onChange={(
                          value
                        ) =>
                          updateEvent(
                            selectedEvent.id,
                            {
                              teamSize:
                                Math.max(
                                  2,
                                  Number(
                                    value
                                  ) || 2
                                ),
                            }
                          )
                        }
                      />
                    )}
                </div>

                <AdminTextarea
                  label="DESCRIPTION"
                  value={
                    selectedEvent.description
                  }
                  onChange={(value) =>
                    updateEvent(
                      selectedEvent.id,
                      {
                        description:
                          value,
                      }
                    )
                  }
                />

                <div className="admin-toggle-row">
                  <div>
                    <strong>
                      SHOW THIS EVENT
                    </strong>

                    <small>
                      Disable this to hide the event from the public website and registration.
                    </small>
                  </div>

                  <button
                    className={`admin-toggle ${selectedEvent.enabled
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      updateEvent(
                        selectedEvent.id,
                        {
                          enabled:
                            !selectedEvent.enabled,
                        }
                      )
                    }
                  >
                    <span />
                  </button>
                </div>
              </AdminEditorSection>

              <AdminEditorSection
                number="02"
                title="EVENT INFORMATION"
                subtitle="Rules, eligibility and prize information."
              >
                <AdminTextarea
                  label="RULES"
                  value={
                    selectedEvent.rules
                  }
                  onChange={(value) =>
                    updateEvent(
                      selectedEvent.id,
                      {
                        rules: value,
                      }
                    )
                  }
                />

                <AdminTextarea
                  label="ELIGIBILITY"
                  value={
                    selectedEvent.eligibility
                  }
                  onChange={(value) =>
                    updateEvent(
                      selectedEvent.id,
                      {
                        eligibility:
                          value,
                      }
                    )
                  }
                />

                <AdminTextarea
                  label="PRIZE DETAILS"
                  value={
                    selectedEvent.prize
                  }
                  onChange={(value) =>
                    updateEvent(
                      selectedEvent.id,
                      {
                        prize: value,
                      }
                    )
                  }
                />
              </AdminEditorSection>

              <AdminEditorSection
                number="03"
                title="MULTIPLE ROUNDS"
                subtitle="Add as many rounds as this event needs."
                action={
                  <button
                    className="admin-secondary-button"
                    onClick={
                      addRound
                    }
                  >
                    + ADD ROUND
                  </button>
                }
              >
                {selectedEvent.rounds
                  .length === 0 ? (
                  <div className="admin-empty-editor">
                    <strong>
                      NO ROUNDS ADDED
                    </strong>

                    <span>
                      Click “ADD ROUND” to create Round 1.
                    </span>
                  </div>
                ) : (
                  <div className="admin-round-editor-list">
                    {selectedEvent.rounds.map(
                      (
                        round,
                        index
                      ) => (
                        <AdminRoundEditor
                          key={
                            round.id
                          }
                          round={
                            round
                          }
                          index={
                            index
                          }
                          updateRound={
                            updateRound
                          }
                          deleteRound={
                            deleteRound
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </AdminEditorSection>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ROUND EDITOR
========================================================= */

function AdminRoundEditor({
  round,
  index,
  updateRound,
  deleteRound,
}: {
  round: EventRound;
  index: number;
  updateRound: (
    id: string,
    updates: Partial<EventRound>
  ) => void;
  deleteRound: (
    id: string
  ) => void;
}) {
  return (
    <div className="admin-round-editor">
      <div className="admin-round-editor-heading">
        <div>
          <span>
            ROUND{" "}
            {(index + 1)
              .toString()
              .padStart(2, "0")}
          </span>

          <h3>
            {round.name}
          </h3>
        </div>

        <button
          className="admin-danger-button"
          onClick={() =>
            deleteRound(
              round.id
            )
          }
        >
          DELETE ROUND
        </button>
      </div>

      <div className="admin-form-grid">
        <AdminInput
          label="ROUND NAME"
          value={round.name}
          onChange={(value) =>
            updateRound(
              round.id,
              {
                name: value,
              }
            )
          }
        />

        <AdminInput
          label="DATE"
          type="date"
          value={round.date}
          onChange={(value) =>
            updateRound(
              round.id,
              {
                date: value,
              }
            )
          }
        />

        <AdminInput
          label="START TIME"
          type="time"
          value={
            round.startTime
          }
          onChange={(value) =>
            updateRound(
              round.id,
              {
                startTime:
                  value,
              }
            )
          }
        />

        <AdminInput
          label="END TIME"
          type="time"
          value={
            round.endTime
          }
          onChange={(value) =>
            updateRound(
              round.id,
              {
                endTime: value,
              }
            )
          }
        />

        <AdminInput
          label="VENUE"
          value={round.venue}
          onChange={(value) =>
            updateRound(
              round.id,
              {
                venue: value,
              }
            )
          }
        />

        <AdminSelect
          label="ROUND MODE"
          value={round.mode}
          options={[
            {
              label:
                "Offline",
              value:
                "Offline",
            },
            {
              label:
                "Online",
              value:
                "Online",
            },
            {
              label:
                "Hybrid",
              value:
                "Hybrid",
            },
          ]}
          onChange={(value) =>
            updateRound(
              round.id,
              {
                mode: value,
              }
            )
          }
        />
      </div>

      <AdminTextarea
        label="ROUND DESCRIPTION"
        value={
          round.description
        }
        onChange={(value) =>
          updateRound(
            round.id,
            {
              description:
                value,
            }
          )
        }
      />
    </div>
  );
}

/* =========================================================
   REGISTRATION MANAGER
========================================================= */

function RegistrationManager({
  events,
  registrations,
  refresh,
}: {
  events: EventItem[];
  registrations: Registration[];
  refresh: () => void;
}) {
  const [activeEvent, setActiveEvent] =
    useState(
      events[0]?.id ?? "all"
    );

  const [search, setSearch] =
    useState("");

  const eventRegistrations =
    registrations.filter(
      (registration) => {
        const matchesEvent =
          activeEvent ===
          "all" ||
          registration.selectedEvents.includes(
            activeEvent
          );

        const searchValue =
          search
            .trim()
            .toLowerCase();

        if (!searchValue)
          return matchesEvent;

        const student =
          registration.student;

        const matchesSearch =
          student.fullName
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          student.registerNumber
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          student.email
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          registration.id
            .toLowerCase()
            .includes(
              searchValue
            );

        return (
          matchesEvent &&
          matchesSearch
        );
      }
    );

  const downloadData = () => {
    const selectedEvent =
      activeEvent === "all"
        ? null
        : events.find(
          (event) => event.id === activeEvent
        );

    const eventName =
      selectedEvent?.name ?? "All Events";

    const exportRegistrations =
      activeEvent === "all"
        ? eventRegistrations
        : eventRegistrations.filter(
          (registration) =>
            registration.selectedEvents.includes(
              activeEvent
            )
        );

    const rows: string[][] = [
      ["Dynamoz 26"],
      ["Computer Science and Engineering"],
      ["University College of Engineering Nagercoil"],
      [""],
      [`${eventName} Registration Report`],
      [`Total Registration : ${exportRegistrations.length}`],
      [""],
      [
        "Registration ID",
        "Name",
        "Register Number",
        "Department",
        "Year",
        "Email",
        "Phone",
        "Events",
        "Team Details",
        "Registered At",
      ],
    ];

    exportRegistrations.forEach(
      (registration) => {
        const eventNames =
          registration.selectedEvents
            .map(
              (eventId) =>
                events.find(
                  (event) =>
                    event.id === eventId
                )?.name ?? eventId
            )
            .join(" | ");

        const teamDetails =
          Object.entries(
            registration.teams
          )
            .map(
              ([eventId, team]) => {
                const event =
                  events.find(
                    (item) =>
                      item.id === eventId
                  );

                return `${event?.name ?? eventId}: ${team.teamName
                  } — ${team.members
                    .map(
                      (member) =>
                        `${member.name} (${member.registerNumber})`
                    )
                    .join(" | ")}`;
              }
            )
            .join(" || ");

        rows.push([
          registration.id,
          registration.student.fullName,
          registration.student.registerNumber,
          registration.student.department,
          registration.student.year,
          registration.student.email,
          registration.student.phone,
          eventNames,
          teamDetails || "Individual",
          registration.createdAt,
        ]);
      }
    );

    const safeEventName =
      eventName
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    const filename =
      activeEvent === "all"
        ? "Dynamoz26_All_Registrations.csv"
        : `Dynamoz26_${safeEventName}_Registrations.csv`;

    downloadCSV(filename, rows);
  };


  return (
    <div className="admin-editor">
      <AdminTopbar
        eyebrow="DYNAMOZ 26 / ADMIN"
        title="REGISTRATION MANAGEMENT"
        action={
          <div className="admin-topbar-actions">
            <button
              className="admin-refresh"
              onClick={refresh}
            >
              ↻ REFRESH
            </button>

            <button
              className="primary-button"
              onClick={
                downloadData
              }
            >
              DOWNLOAD CSV
              <span>↓</span>
            </button>
          </div>
        }
      />

      <div className="admin-registration-toolbar">
        <div className="admin-event-tabs">
          <button
            className={
              activeEvent ===
                "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveEvent(
                "all"
              )
            }
          >
            ALL
          </button>

          {events.map(
            (event) => (
              <button
                key={event.id}
                className={
                  activeEvent ===
                    event.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveEvent(
                    event.id
                  )
                }
              >
                {event.name}
              </button>
            )
          )}
        </div>

        <input
          className="admin-search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search name, register number, email..."
        />
      </div>

      <div className="admin-stats">
        <div>
          <span>
            FILTERED REGISTRATIONS
          </span>

          <strong>
            {eventRegistrations.length}
          </strong>
        </div>

        <div>
          <span>
            TOTAL REGISTRATIONS
          </span>

          <strong>
            {registrations.length}
          </strong>
        </div>

        <div>
          <span>
            SELECTED EVENT
          </span>

          <strong>
            {activeEvent ===
              "all"
              ? "ALL EVENTS"
              : events.find(
                (event) =>
                  event.id ===
                  activeEvent
              )?.name ??
              "EVENT"}
          </strong>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  REG ID
                </th>

                <th>
                  NAME
                </th>

                <th>
                  REGISTER NUMBER
                </th>

                <th>
                  DEPARTMENT
                </th>

                <th>
                  YEAR
                </th>

                <th>
                  EMAIL
                </th>

                <th>
                  PHONE
                </th>

                <th>
                  EVENTS
                </th>

                <th>
                  TEAM
                </th>
              </tr>
            </thead>

            <tbody>
              {eventRegistrations.map(
                (
                  registration
                ) => (
                  <tr
                    key={
                      registration.id
                    }
                  >
                    <td>
                      {
                        registration.id
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .fullName
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .registerNumber
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .department
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .year
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .email
                      }
                    </td>

                    <td>
                      {
                        registration
                          .student
                          .phone
                      }
                    </td>

                    <td>
                      {
                        registration
                          .selectedEvents
                          .map(
                            (
                              eventId
                            ) =>
                              events.find(
                                (
                                  event
                                ) =>
                                  event.id ===
                                  eventId
                              )?.name ??
                              eventId
                          )
                          .join(
                            ", "
                          )}
                    </td>

                    <td>
                      {Object.values(
                        registration.teams
                      )
                        .map(
                          (
                            team
                          ) =>
                            team.teamName
                        )
                        .join(
                          ", "
                        ) ||
                        "Individual"}
                    </td>
                  </tr>
                )
              )}

              {eventRegistrations.length ===
                0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="empty-admin"
                    >
                      NO REGISTRATIONS FOUND
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN COMPONENTS
========================================================= */

function AdminEditorSection({
  number,
  title,
  subtitle,
  action,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-editor-section">
      <div className="admin-editor-section-heading">
        <div>
          <div className="admin-section-number">
            {number}
          </div>

          <div>
            <h2>{title}</h2>

            {subtitle && (
              <p>{subtitle}</p>
            )}
          </div>
        </div>

        {action}
      </div>

      <div className="admin-editor-section-body">
        {children}
      </div>
    </section>
  );
}

function AdminPosterUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  const handleFile = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Poster image must be 5MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="admin-field admin-poster-upload">
      <label>EVENT POSTER</label>

      <div className="poster-upload-box">
        <div className="poster-upload-preview">
          {value ? (
            <img src={value} alt="Event poster preview" />
          ) : (
            <div className="poster-upload-placeholder">
              <span>＋</span>
              <strong>UPLOAD POSTER</strong>
              <small>PNG, JPG or WEBP · MAX 5MB</small>
            </div>
          )}
        </div>

        <div className="poster-upload-actions">
          <label className="admin-upload-button">
            {value ? "CHANGE POSTER" : "CHOOSE IMAGE"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>

          {value && (
            <button
              type="button"
              className="admin-clear-button"
              onClick={() => onChange(undefined)}
            >
              REMOVE
            </button>
          )}
        </div>
      </div>

      <small className="admin-field-help">
        This poster will appear directly in <strong>EXPLORE EVENTS</strong>, the event details popup and registration event selection.
      </small>
    </div>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </div>
  );
}

function AdminTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div className="admin-field admin-field-full">
      <label>{label}</label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        rows={4}
      />
    </div>
  );
}

function AdminSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: {
    label: string;
    value: string;
  }[];
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function AdminEmptyEvents({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="admin-empty-state">
      <div>◆</div>

      <h2>
        NO EVENTS YET
      </h2>

      <p>
        Create your first event
        to start managing the
        symposium.
      </p>

      <button
        className="primary-button"
        onClick={onAdd}
      >
        + CREATE EVENT
      </button>
    </div>
  );
}

/* =========================================================
   PUBLIC SITE
========================================================= */

function PublicSite({
  onRegister,
  events,
  config,
}: {
  onRegister: (
    eventId?: string
  ) => void;
  events: EventItem[];
  config: SiteConfig;
}) {
  const scrollToSection = (
    section: Section
  ) => {
    const element =
      document.getElementById(
        section
      );

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="app">
      <Navbar
        onSection={
          scrollToSection
        }
        onRegister={() =>
          onRegister()
        }
        config={config}
      />

      <main>
        <HeroSection
          config={config}
          onRegister={() =>
            onRegister()
          }
          onEvents={() =>
            scrollToSection(
              "events"
            )
          }
        />

        <EventsSection
          events={events}
          onRegister={(eventId) =>
            onRegister(
              eventId
            )
          }
        />

        <AboutSection
          config={config}
        />

        <PeopleSection
          config={config}
        />

        <ContactSection
          config={config}
        />
      </main>

      <Footer config={config} />
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [registrationOpen, setRegistrationOpen] =
    useState(false);

  const [registrationEventId, setRegistrationEventId] =
    useState<string | undefined>(
      undefined
    );

  const [path, setPath] =
    useState(
      window.location.pathname.toLowerCase()
    );

  const [events, setEvents] =
    useState<EventItem[]>(
      getStoredEvents()
    );

  const [config, setConfig] =
    useState<SiteConfig>(
      getStoredConfig()
    );

  const [adminAuthenticated, setAdminAuthenticated] =
    useState(
      localStorage.getItem(
        "dynamoz26_admin_auth"
      ) === "true"
    );

  useEffect(() => {
    const handlePopState =
      () => {
        setPath(
          window.location.pathname.toLowerCase()
        );
      };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  useEffect(() => {
    const handleStorage =
      () => {
        setEvents(
          getStoredEvents()
        );

        setConfig(
          getStoredConfig()
        );
      };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  const openRegistration = (
    eventId?: string
  ) => {
    if (
      !config.registrationEnabled ||
      isRegistrationDeadlinePassed(
        config.registrationDeadline
      )
    ) {
      alert(
        "Registration is currently closed."
      );

      return;
    }

    setRegistrationEventId(
      eventId
    );

    setRegistrationOpen(
      true
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeRegistration =
    () => {
      setRegistrationOpen(
        false
      );

      setRegistrationEventId(
        undefined
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const logoutAdmin = () => {
    localStorage.removeItem(
      "dynamoz26_admin_auth"
    );

    setAdminAuthenticated(
      false
    );
  };

  if (path === "/admin") {
    if (!adminAuthenticated) {
      return (
        <AdminLogin
          onLogin={() =>
            setAdminAuthenticated(
              true
            )
          }
        />
      );
    }

    return (
      <AdminPage
        onLogout={
          logoutAdmin
        }
      />
    );
  }

  if (registrationOpen) {
    return (
      <RegistrationPage
        events={events}
        config={config}
        initialEventId={
          registrationEventId
        }
        onBackHome={
          closeRegistration
        }
      />
    );
  }

  return (
    <PublicSite
      events={events}
      config={config}
      onRegister={
        openRegistration
      }
    />
  );
}