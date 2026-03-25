import { useEffect, useState } from "react";
import { useTaskStore } from "./store/taskStore";
import { generateTasks } from "./utils/generateTasks";
import KanbanView from "./views/KanbanView";
import ListView from "./views/ListView";
import TimelineView from "./views/TimelineView";

// This is the main app component that handles the overall layout and state management
function App() {
  // Get all the state and actions from our Zustand store
  const {
    tasks,
    currentView,
    filters,
    setTasks,
    setCurrentView,
    setFilters,
    setSort,
    sortBy,
    sortDirection,
  } = useTaskStore();

  // Keep track of users who are currently active (for collaboration simulation)
  const [activeUsers, setActiveUsers] = useState<
    { id: string; name: string; taskId?: string }[]
  >([]);

  // Load initial task data when the app starts
  useEffect(() => {
    const initialTasks = generateTasks();
    setTasks(initialTasks);
  }, [setTasks]);

  // Simulate real-time collaboration by randomly assigning users to tasks
  useEffect(() => {
    const possibleUsers = ["Alice", "Bob", "Charlie", "Diana"];

    const collaborationTimer = setInterval(() => {
      // For each user, decide if they're active and what they're looking at
      const updatedUsers = possibleUsers.map((userName, index) => {
        const isUserActive = Math.random() > 0.5; // 50% chance of being active

        if (isUserActive && tasks.length > 0) {
          // Pick a random task for them to be viewing
          const randomTaskIndex = Math.floor(Math.random() * tasks.length);
          const taskTheyreViewing = tasks[randomTaskIndex];

          return {
            id: (index + 1).toString(),
            name: userName,
            taskId: taskTheyreViewing.id,
          };
        }

        // User is not active
        return {
          id: (index + 1).toString(),
          name: userName,
        };
      });

      setActiveUsers(updatedUsers);
    }, 3000); // Update every 3 seconds

    // Clean up the timer when component unmounts
    return () => clearInterval(collaborationTimer);
  }, [tasks]);

  // Read filter settings from the URL when the app loads
  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);

    // Get the view type from URL, default to kanban
    const viewFromUrl =
      (urlSearchParams.get("view") as "kanban" | "list" | "timeline") ||
      "kanban";

    // Parse filter values from URL
    const statusFilters = urlSearchParams.get("status")?.split(",") || [];
    const priorityFilters = urlSearchParams.get("priority")?.split(",") || [];
    const assigneeFilters = urlSearchParams.get("assignee")?.split(",") || [];
    const startDateFilter = urlSearchParams.get("dueDateFrom") || "";
    const endDateFilter = urlSearchParams.get("dueDateTo") || "";

    // Apply these settings to our store
    setCurrentView(viewFromUrl);
    setFilters({
      status: statusFilters,
      priority: priorityFilters,
      assignee: assigneeFilters,
      dueDateFrom: startDateFilter,
      dueDateTo: endDateFilter,
    });
  }, [setCurrentView, setFilters]);

  // Helper function to update the browser URL with current filter settings
  const syncFiltersToUrl = () => {
    const urlParams = new URLSearchParams();

    // Add current view
    urlParams.set("view", currentView);

    // Add active filters
    if (filters.status.length > 0) {
      urlParams.set("status", filters.status.join(","));
    }
    if (filters.priority.length > 0) {
      urlParams.set("priority", filters.priority.join(","));
    }
    if (filters.assignee.length > 0) {
      urlParams.set("assignee", filters.assignee.join(","));
    }
    if (filters.dueDateFrom) {
      urlParams.set("dueDateFrom", filters.dueDateFrom);
    }
    if (filters.dueDateTo) {
      urlParams.set("dueDateTo", filters.dueDateTo);
    }

    // Update the URL without causing a page reload
    window.history.replaceState({}, "", `?${urlParams.toString()}`);
  };

  // Keep the URL in sync whenever filters or view change
  useEffect(() => {
    syncFiltersToUrl();
  }, [currentView, filters]);

  // Filter tasks based on current filter settings
  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      // Check status filter
      if (filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false;
      }

      // Check priority filter
      if (
        filters.priority.length > 0 &&
        !filters.priority.includes(task.priority)
      ) {
        return false;
      }

      // Check assignee filter
      if (
        filters.assignee.length > 0 &&
        !filters.assignee.includes(task.assignee)
      ) {
        return false;
      }

      // Check date range filters
      if (filters.dueDateFrom && task.dueDate < filters.dueDateFrom) {
        return false;
      }
      if (filters.dueDateTo && task.dueDate > filters.dueDateTo) {
        return false;
      }

      return true;
    });
  };

  // Sort the filtered tasks
  const getSortedTasks = (filteredTasks: typeof tasks) => {
    return [...filteredTasks].sort((taskA, taskB) => {
      let valueA: any;
      let valueB: any;

      // Sort by title (alphabetical)
      if (sortBy === "title") {
        valueA = taskA.title.toLowerCase();
        valueB = taskB.title.toLowerCase();
      }
      // Sort by priority (critical > high > medium > low)
      else if (sortBy === "priority") {
        const priorityLevels = { critical: 4, high: 3, medium: 2, low: 1 };
        valueA = priorityLevels[taskA.priority as keyof typeof priorityLevels];
        valueB = priorityLevels[taskB.priority as keyof typeof priorityLevels];
      }
      // Sort by due date
      else if (sortBy === "dueDate") {
        valueA = new Date(taskA.dueDate);
        valueB = new Date(taskB.dueDate);
      }

      // Return comparison based on sort direction
      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };

  // Get the final list of tasks to display
  const filteredTasks = getFilteredTasks();
  const sortedTasks = getSortedTasks(filteredTasks);

  // Check if any filters are active (for showing the clear button)
  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.assignee.length > 0 ||
    filters.dueDateFrom ||
    filters.dueDateTo;

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
      {/* Top navigation and controls */}
      <div className="mb-4">
        {/* View selector buttons - responsive layout */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
          <button
            onClick={() => setCurrentView("kanban")}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded transition-colors ${
              currentView === "kanban"
                ? "bg-blue-500 text-white"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setCurrentView("list")}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded transition-colors ${
              currentView === "list"
                ? "bg-blue-500 text-white"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setCurrentView("timeline")}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded transition-colors ${
              currentView === "timeline"
                ? "bg-blue-500 text-white"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            Timeline
          </button>
        </div>

        {/* Filter controls - responsive grid */}
        <div className="bg-white p-2 sm:p-4 rounded shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 mb-3 sm:mb-4">
            {/* Status filter */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                multiple
                value={filters.status}
                onChange={(e) =>
                  setFilters({
                    status: Array.from(
                      e.target.selectedOptions,
                      (option) => option.value,
                    ),
                  })
                }
                className="border p-2 rounded text-sm w-full"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Priority filter */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                multiple
                value={filters.priority}
                onChange={(e) =>
                  setFilters({
                    priority: Array.from(
                      e.target.selectedOptions,
                      (option) => option.value,
                    ),
                  })
                }
                className="border p-2 rounded text-sm w-full"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Assignee filter */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <select
                multiple
                value={filters.assignee}
                onChange={(e) =>
                  setFilters({
                    assignee: Array.from(
                      e.target.selectedOptions,
                      (option) => option.value,
                    ),
                  })
                }
                className="border p-2 rounded text-sm w-full"
              >
                <option value="Swathi">Swathi</option>
                <option value="Ravi">Ravi</option>
                <option value="Anil">Anil</option>
                <option value="Priya">Priya</option>
                <option value="Kiran">Kiran</option>
                <option value="Meera">Meera</option>
              </select>
            </div>

            {/* Date range filters */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-700 mb-1">
                Due From
              </label>
              <input
                type="date"
                value={filters.dueDateFrom}
                onChange={(e) => setFilters({ dueDateFrom: e.target.value })}
                className="border p-2 rounded text-sm w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-700 mb-1">
                Due To
              </label>
              <input
                type="date"
                value={filters.dueDateTo}
                onChange={(e) => setFilters({ dueDateTo: e.target.value })}
                className="border p-2 rounded text-sm w-full"
              />
            </div>

            {/* Clear filters button */}
            <div className="flex flex-col justify-end">
              {hasActiveFilters && (
                <button
                  onClick={() =>
                    setFilters({
                      status: [],
                      priority: [],
                      assignee: [],
                      dueDateFrom: "",
                      dueDateTo: "",
                    })
                  }
                  className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Collaboration status - responsive */}
        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span>
              {activeUsers.filter((user) => user.taskId).length} people are
              viewing this board
            </span>
            <div className="flex gap-2">
              {activeUsers
                .filter((user) => user.taskId)
                .map((user) => (
                  <div
                    key={user.id}
                    className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs"
                    title={`${user.name} is viewing a task`}
                  >
                    {user.name[0]}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - render the selected view */}
      {currentView === "kanban" && (
        <KanbanView tasks={filteredTasks} activeUsers={activeUsers} />
      )}
      {currentView === "list" && (
        <ListView
          tasks={sortedTasks}
          activeUsers={activeUsers}
          onSort={setSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
        />
      )}
      {currentView === "timeline" && (
        <TimelineView tasks={filteredTasks} activeUsers={activeUsers} />
      )}
    </div>
  );
}

export default App;
