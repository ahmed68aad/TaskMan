import { startTransition, useDeferredValue, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
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

const filters = ["all", "active", "done", "overdue"];

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
        <section className="auth-hero" aria-label="Task manager introduction">
          <div className="brand-mark">tm</div>
          <p className="eyebrow">Private task command center</p>
          <h1>Catch every loose thread before it becomes a knot.</h1>
          <p className="hero-copy">
            Sign in to manage your own tasks, due dates, progress, and the small
            daily wins that keep projects moving.
          </p>
          <div className="hero-card">
            <span>Backend ready</span>
            <strong>JWT auth + scoped tasks</strong>
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
                  ? "Start your workspace"
                  : "Enter your workspace"}
              </h2>
            </div>

            {authMode === "signup" && (
              <label>
                Name
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
              Email
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
              Password
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
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Task manager</p>
          <h1>Today has a plan.</h1>
          <p className="hero-copy">
            {user?.name ? `Welcome, ${user.name}. ` : ""}
            Build the list, clear the noise, and keep the useful things visible.
          </p>
        </div>
        <button className="ghost-action" onClick={handleLogout} type="button">
          Sign out
        </button>
      </section>

      <section className="stats-grid" aria-label="Task summary">
        <article>
          <span>Total</span>
          <strong>{totalTasks}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{activeTasks}</strong>
        </article>
        <article>
          <span>Done</span>
          <strong>{completedTasks}</strong>
        </article>
        <article className={overdueTasks ? "attention" : ""}>
          <span>Overdue</span>
          <strong>{overdueTasks}</strong>
        </article>
      </section>

      <section className="workspace-grid">
        <aside className="task-composer" aria-label="Add a task">
          <p className="form-kicker">New task</p>
          <h2>Put it on the board</h2>
          <form onSubmit={handleCreateTask}>
            <label>
              Title
              <input
                onChange={(event) => updateTaskField("title", event.target.value)}
                placeholder="Ship landing page"
                required
                type="text"
                value={taskForm.title}
              />
            </label>

            <label>
              Description
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
              Due date
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
              {isSavingTask ? "Saving..." : "Add task"}
            </button>
          </form>
        </aside>

        <section className="task-board" aria-label="Task list">
          <div className="board-toolbar">
            <div>
              <p className="form-kicker">Your queue</p>
              <h2>{isTaskLoading ? "Loading tasks..." : `${visibleTasks.length} shown`}</h2>
            </div>
            <input
              aria-label="Search tasks"
              className="search-input"
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Search tasks"
              type="search"
              value={search}
            />
          </div>

          <div className="filter-row" aria-label="Filter tasks">
            {filters.map((filterName) => (
              <button
                className={filter === filterName ? "active" : ""}
                key={filterName}
                onClick={() => changeFilter(filterName)}
                type="button"
              >
                {filterName}
              </button>
            ))}
          </div>

          <div className="task-list">
            {!isTaskLoading && visibleTasks.length === 0 && (
              <div className="empty-state">
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
                        Title
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
                        Description
                        <textarea
                          onChange={(event) =>
                            updateEditField("description", event.target.value)
                          }
                          rows="3"
                          value={editForm.description}
                        />
                      </label>
                      <label>
                        Due date
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
                          {task.completed ? "Ok" : ""}
                        </button>
                        <div>
                          <h3>{task.title}</h3>
                          {task.description && <p>{task.description}</p>}
                          <span className={isOverdue ? "due-date overdue" : "due-date"}>
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
                          Edit
                        </button>
                        <button
                          className="danger-action compact"
                          onClick={() => handleDeleteTask(task)}
                          type="button"
                        >
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
