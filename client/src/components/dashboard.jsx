import { startTransition, useDeferredValue, useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "task_manager_token";
const USER_KEY = "task_manager_user";

const emptyAuthForm = {
  name: "",
  email: "",
  password: "",
};

const emptyTaskForm = {
  title: "",
  description: "",
  dueDate: "",
};

const filters = [
  { key: "all", label: "All", icon: "layers" },
  { key: "active", label: "Active", icon: "circle" },
  { key: "done", label: "Done", icon: "check" },
  { key: "overdue", label: "Overdue", icon: "alert" },
];

const Icon = ({ name, className = "" }) => {
  const paths = {
    alert: (
      <>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.9 2.5 17.3A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </>
    ),
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3.5 9.5h17" />
        <path d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    circle: (
      <>
        <circle cx="12" cy="12" r="8" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 13 9 5 9-5" />
        <path d="m3 18 9 5 9-5" />
      </>
    ),
    lock: (
      <>
        <path d="M7 11V8a5 5 0 0 1 10 0v3" />
        <path d="M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
      </>
    ),
    logOut: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
    mail: (
      <>
        <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.7-3.7" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9.5 12 1.8 1.8L15 9.8" />
      </>
    ),
    sparkle: (
      <>
        <path d="M12 2 9.8 8.4 4 11l5.8 2.6L12 20l2.2-6.4L20 11l-5.8-2.6L12 2Z" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </>
    ),
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={`icon ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
};

const TaskManLogo = ({ compact = false }) => (
  <div className={compact ? "app-logo compact-logo" : "app-logo"}>
    <svg aria-hidden="true" className="logo-symbol" viewBox="0 0 64 64">
      <rect className="logo-bg" height="52" rx="18" width="52" x="6" y="6" />
      <path className="logo-fold" d="M42 6h-8c12 6 18 15 18 28v-10A18 18 0 0 0 42 6Z" />
      <path className="logo-check" d="m21 33 8 8 16-19" />
      <path className="logo-line" d="M19 20h18" />
    </svg>
    {!compact && (
      <span>
        <strong>Task</strong>
        <em>Man</em>
      </span>
    )}
  </div>
);

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const apiRequest = async (path, { body, method = "GET", token } = {}) => {
  const headers = {};

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers.token = token;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

const getDueTime = (task) => {
  if (!task.dueDate) return Number.POSITIVE_INFINITY;

  const date = new Date(task.dueDate);
  return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime();
};

const sortTasks = (tasks) =>
  [...tasks].sort((firstTask, secondTask) => {
    const completionOrder =
      Number(firstTask.completed) - Number(secondTask.completed);

    if (completionOrder !== 0) {
      return completionOrder;
    }

    const dueDateOrder = getDueTime(firstTask) - getDueTime(secondTask);

    if (dueDateOrder !== 0) {
      return dueDateOrder;
    }

    return new Date(secondTask.createdAt || 0) - new Date(firstTask.createdAt || 0);
  });

const toDateTimeInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const formatDate = (value) => {
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getLocalDateTimeMin = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

function Dashboard() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(readStoredUser);
  const [authMode, setAuthMode] = useState("signin");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [editForm, setEditForm] = useState(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const dateTimeMin = getLocalDateTimeMin();
  const isSignedIn = Boolean(token);

  useEffect(() => {
    if (!token) {
      setTasks([]);
      return undefined;
    }

    let isActive = true;

    const loadTasks = async () => {
      setIsTaskLoading(true);
      setError("");

      try {
        const data = await apiRequest("/tasks/list", { token });

        if (isActive) {
          setTasks(sortTasks(data.tasks || []));
        }
      } catch (requestError) {
        if (isActive) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken("");
          setUser(null);
          setError(requestError.message);
        }
      } finally {
        if (isActive) {
          setIsTaskLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      isActive = false;
    };
  }, [token]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const overdueTasks = tasks.filter(
    (task) =>
      task.dueDate && !task.completed && new Date(task.dueDate).getTime() < Date.now(),
  ).length;

  const visibleTasks = tasks.filter((task) => {
    const searchText = `${task.title} ${task.description || ""}`.toLowerCase();
    const matchesSearch = !deferredSearch || searchText.includes(deferredSearch);
    const isOverdue =
      task.dueDate && !task.completed && new Date(task.dueDate).getTime() < Date.now();

    if (!matchesSearch) {
      return false;
    }

    if (filter === "active") {
      return !task.completed;
    }

    if (filter === "done") {
      return task.completed;
    }

    if (filter === "overdue") {
      return isOverdue;
    }

    return true;
  });

  const stats = [
    { label: "Total", value: totalTasks, icon: "layers" },
    { label: "Active", value: activeTasks, icon: "circle" },
    { label: "Done", value: completedTasks, icon: "check" },
    { label: "Overdue", value: overdueTasks, icon: "alert", attention: overdueTasks },
  ];

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const updateAuthField = (field, value) => {
    clearFeedback();
    setAuthForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const updateTaskField = (field, value) => {
    clearFeedback();
    setTaskForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const updateEditField = (field, value) => {
    clearFeedback();
    setEditForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    clearFeedback();
    setIsAuthLoading(true);

    try {
      const endpoint = authMode === "signup" ? "/users/signup" : "/users/signin";
      const body =
        authMode === "signup"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password,
            };
      const data = await apiRequest(endpoint, {
        method: "POST",
        body,
      });
      const signedInUser =
        data.user ||
        ({
          name: authForm.name || authForm.email.split("@")[0],
          email: authForm.email,
        });

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(signedInUser));

      setToken(data.token);
      setUser(signedInUser);
      setAuthForm(emptyAuthForm);
      setMessage("You are signed in. Let's turn the task pile into a neat stack.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
    setTasks([]);
    setTaskForm(emptyTaskForm);
    setEditingTaskId("");
    setMessage("Signed out successfully.");
  };

  const buildTaskBody = (form) => ({
    title: form.title.trim(),
    description: form.description.trim(),
    dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
  });

  const handleCreateTask = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!taskForm.title.trim()) {
      setError("Task title is required.");
      return;
    }

    setIsSavingTask(true);

    try {
      const data = await apiRequest("/tasks", {
        method: "POST",
        token,
        body: buildTaskBody(taskForm),
      });

      setTasks((currentTasks) => sortTasks([data.task, ...currentTasks]));
      setTaskForm(emptyTaskForm);
      setMessage("Task added.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleToggleTask = async (task) => {
    clearFeedback();

    try {
      const data = await apiRequest(`/tasks/${task._id}`, {
        method: "PATCH",
        token,
        body: {
          completed: !task.completed,
        },
      });

      setTasks((currentTasks) =>
        sortTasks(
          currentTasks.map((currentTask) =>
            currentTask._id === task._id ? data.task : currentTask,
          ),
        ),
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDeleteTask = async (task) => {
    clearFeedback();

    try {
      await apiRequest(`/tasks/${task._id}`, {
        method: "DELETE",
        token,
      });

      setTasks((currentTasks) =>
        currentTasks.filter((currentTask) => currentTask._id !== task._id),
      );
      setMessage("Task deleted.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const startEditingTask = (task) => {
    clearFeedback();
    setEditingTaskId(task._id);
    setEditForm({
      title: task.title,
      description: task.description || "",
      dueDate: toDateTimeInputValue(task.dueDate),
    });
  };

  const cancelEditingTask = () => {
    setEditingTaskId("");
    setEditForm(emptyTaskForm);
  };

  const handleUpdateTask = async (event, task) => {
    event.preventDefault();
    clearFeedback();

    if (!editForm.title.trim()) {
      setError("Task title is required.");
      return;
    }

    const originalDueDate = toDateTimeInputValue(task.dueDate);
    const body = {};

    if (editForm.title.trim() !== task.title) {
      body.title = editForm.title.trim();
    }

    if (editForm.description.trim() !== (task.description || "")) {
      body.description = editForm.description.trim();
    }

    if (editForm.dueDate !== originalDueDate) {
      body.dueDate = editForm.dueDate
        ? new Date(editForm.dueDate).toISOString()
        : null;
    }

    if (Object.keys(body).length === 0) {
      cancelEditingTask();
      return;
    }

    setIsSavingTask(true);

    try {
      const data = await apiRequest(`/tasks/${task._id}`, {
        method: "PATCH",
        token,
        body,
      });

      setTasks((currentTasks) =>
        sortTasks(
          currentTasks.map((currentTask) =>
            currentTask._id === task._id ? data.task : currentTask,
          ),
        ),
      );
      cancelEditingTask();
      setMessage("Task updated.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSavingTask(false);
    }
  };

  const changeFilter = (nextFilter) => {
    startTransition(() => {
      setFilter(nextFilter);
    });
  };

  const changeSearch = (value) => {
    setSearch(value);
  };

  if (!isSignedIn) {
    return (
      <main className="auth-shell">
        <section className="auth-hero" aria-label="Task Man introduction">
          <div className="hero-topline">
            <TaskManLogo />
            <span className="hero-badge">
              <Icon name="shield" />
              Private workspace
            </span>
          </div>
          <p className="eyebrow">Task Man keeps the day calm</p>
          <h1>Plan the work. Finish with less noise.</h1>
          <p className="hero-copy">
            A focused task board for personal planning, deadlines, and the small
            decisions that move real projects forward.
          </p>
          <div className="hero-card-grid" aria-label="Product highlights">
            <article className="hero-card">
              <Icon name="shield" />
              <span>Secure auth</span>
              <strong>JWT protected tasks</strong>
            </article>
            <article className="hero-card">
              <Icon name="calendar" />
              <span>Due dates</span>
              <strong>Spot urgency fast</strong>
            </article>
          </div>
        </section>

        <section className="auth-panel" aria-label="Authentication form">
          <div className="auth-tabs" role="tablist" aria-label="Auth mode">
            <button
              className={authMode === "signin" ? "active" : ""}
              type="button"
              onClick={() => {
                clearFeedback();
                setAuthMode("signin");
              }}
            >
              <Icon name="lock" />
              Sign in
            </button>
            <button
              className={authMode === "signup" ? "active" : ""}
              type="button"
              onClick={() => {
                clearFeedback();
                setAuthMode("signup");
              }}
            >
              <Icon name="user" />
              Sign up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div>
              <p className="form-kicker">
                {authMode === "signup" ? "Create account" : "Welcome back"}
              </p>
              <h2>
                {authMode === "signup"
                  ? "Start with Task Man"
                  : "Open your board"}
              </h2>
            </div>

            {authMode === "signup" && (
              <label>
                <span>
                  <Icon name="user" />
                  Name
                </span>
                <input
                  autoComplete="name"
                  onChange={(event) => updateAuthField("name", event.target.value)}
                  placeholder="Ahmed"
                  required
                  type="text"
                  value={authForm.name}
                />
              </label>
            )}

            <label>
              <span>
                <Icon name="mail" />
                Email
              </span>
              <input
                autoComplete="email"
                onChange={(event) => updateAuthField("email", event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={authForm.email}
              />
            </label>

            <label>
              <span>
                <Icon name="lock" />
                Password
              </span>
              <input
                autoComplete={
                  authMode === "signup" ? "new-password" : "current-password"
                }
                minLength={8}
                onChange={(event) =>
                  updateAuthField("password", event.target.value)
                }
                placeholder="At least 8 characters"
                required
                type="password"
                value={authForm.password}
              />
            </label>

            {error && <p className="feedback error">{error}</p>}
            {message && <p className="feedback success">{message}</p>}

            <button className="primary-action" disabled={isAuthLoading} type="submit">
              <Icon name="sparkle" />
              {isAuthLoading
                ? "Working..."
                : authMode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <TaskManLogo />
        <button className="ghost-action" onClick={handleLogout} type="button">
          <Icon name="logOut" />
          Sign out
        </button>
      </header>

      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Good to see you{user?.name ? `, ${user.name}` : ""}</p>
          <h1>Make today feel handled.</h1>
          <p className="hero-copy">
            Capture the work, track deadlines, and move finished tasks out of
            your mental background noise.
          </p>
        </div>
        <div className="hero-mini-card">
          <Icon name="sparkle" />
          <span>Focus mode</span>
          <strong>{activeTasks} open tasks</strong>
        </div>
      </section>

      <section className="stats-grid" aria-label="Task summary">
        {stats.map((stat) => (
          <article className={stat.attention ? "attention" : ""} key={stat.label}>
            <span className="stat-icon">
              <Icon name={stat.icon} />
            </span>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="workspace-grid">
        <aside className="task-composer" aria-label="Add a task">
          <div className="panel-title">
            <span className="panel-icon">
              <Icon name="plus" />
            </span>
            <div>
              <p className="form-kicker">New task</p>
              <h2>Add to the board</h2>
            </div>
          </div>
          <form onSubmit={handleCreateTask}>
            <label>
              <span>
                <Icon name="layers" />
                Title
              </span>
              <input
                onChange={(event) => updateTaskField("title", event.target.value)}
                placeholder="Ship landing page"
                required
                type="text"
                value={taskForm.title}
              />
            </label>

            <label>
              <span>
                <Icon name="edit" />
                Description
              </span>
              <textarea
                onChange={(event) =>
                  updateTaskField("description", event.target.value)
                }
                placeholder="What needs to happen?"
                rows="5"
                value={taskForm.description}
              />
            </label>

            <label>
              <span>
                <Icon name="calendar" />
                Due date
              </span>
              <input
                min={dateTimeMin}
                onChange={(event) => updateTaskField("dueDate", event.target.value)}
                type="datetime-local"
                value={taskForm.dueDate}
              />
            </label>

            {error && <p className="feedback error">{error}</p>}
            {message && <p className="feedback success">{message}</p>}

            <button className="primary-action" disabled={isSavingTask} type="submit">
              <Icon name="plus" />
              {isSavingTask ? "Saving..." : "Add task"}
            </button>
          </form>
        </aside>

        <section className="task-board" aria-label="Task list">
          <div className="board-toolbar">
            <div className="panel-title">
              <span className="panel-icon">
                <Icon name="layers" />
              </span>
              <div>
                <p className="form-kicker">Your queue</p>
                <h2>
                  {isTaskLoading ? "Loading tasks..." : `${visibleTasks.length} shown`}
                </h2>
              </div>
            </div>
            <label className="search-field">
              <Icon name="search" />
              <input
                aria-label="Search tasks"
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Search tasks"
                type="search"
                value={search}
              />
            </label>
          </div>

          <div className="filter-row" aria-label="Filter tasks">
            {filters.map((filterItem) => (
              <button
                className={filter === filterItem.key ? "active" : ""}
                key={filterItem.key}
                onClick={() => changeFilter(filterItem.key)}
                type="button"
              >
                <Icon name={filterItem.icon} />
                {filterItem.label}
              </button>
            ))}
          </div>

          <div className="task-list">
            {!isTaskLoading && visibleTasks.length === 0 && (
              <div className="empty-state">
                <TaskManLogo compact />
                <strong>No tasks here.</strong>
                <span>
                  {tasks.length
                    ? "Try a different filter or search."
                    : "Add your first task and give the day a spine."}
                </span>
              </div>
            )}

            {visibleTasks.map((task) => {
              const isEditing = editingTaskId === task._id;
              const isOverdue =
                task.dueDate &&
                !task.completed &&
                new Date(task.dueDate).getTime() < Date.now();

              return (
                <article
                  className={`task-card ${task.completed ? "completed" : ""}`}
                  key={task._id}
                >
                  {isEditing ? (
                    <form
                      className="edit-form"
                      onSubmit={(event) => handleUpdateTask(event, task)}
                    >
                      <label>
                        <span>
                          <Icon name="layers" />
                          Title
                        </span>
                        <input
                          onChange={(event) =>
                            updateEditField("title", event.target.value)
                          }
                          required
                          type="text"
                          value={editForm.title}
                        />
                      </label>
                      <label>
                        <span>
                          <Icon name="edit" />
                          Description
                        </span>
                        <textarea
                          onChange={(event) =>
                            updateEditField("description", event.target.value)
                          }
                          rows="3"
                          value={editForm.description}
                        />
                      </label>
                      <label>
                        <span>
                          <Icon name="calendar" />
                          Due date
                        </span>
                        <input
                          min={dateTimeMin}
                          onChange={(event) =>
                            updateEditField("dueDate", event.target.value)
                          }
                          type="datetime-local"
                          value={editForm.dueDate}
                        />
                      </label>
                      <div className="card-actions">
                        <button
                          className="primary-action compact"
                          disabled={isSavingTask}
                          type="submit"
                        >
                          <Icon name="check" />
                          Save
                        </button>
                        <button
                          className="ghost-action compact"
                          onClick={cancelEditingTask}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="task-content">
                        <button
                          aria-label={
                            task.completed
                              ? "Mark task as active"
                              : "Mark task as complete"
                          }
                          className="check-button"
                          onClick={() => handleToggleTask(task)}
                          type="button"
                        >
                          {task.completed && <Icon name="check" />}
                        </button>
                        <div>
                          <h3>{task.title}</h3>
                          {task.description && <p>{task.description}</p>}
                          <span className={isOverdue ? "due-date overdue" : "due-date"}>
                            <Icon name={isOverdue ? "alert" : "calendar"} />
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button
                          className="ghost-action compact"
                          onClick={() => startEditingTask(task)}
                          type="button"
                        >
                          <Icon name="edit" />
                          Edit
                        </button>
                        <button
                          className="danger-action compact"
                          onClick={() => handleDeleteTask(task)}
                          type="button"
                        >
                          <Icon name="trash" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

export default Dashboard;
