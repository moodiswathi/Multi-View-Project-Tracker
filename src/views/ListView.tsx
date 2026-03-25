import { useState, useRef } from "react";
import { useTaskStore } from "../store/taskStore";
import type { Task } from "../types/task";
import dayjs from "dayjs";

interface ListViewProps {
  tasks: Task[];
  activeUsers: { id: string; name: string; taskId?: string }[];
  onSort: (
    sortBy: "title" | "priority" | "dueDate",
    direction: "asc" | "desc",
  ) => void;
  sortBy: "title" | "priority" | "dueDate";
  sortDirection: "asc" | "desc";
}

/**
 * ListView displays tasks in a sortable table format with virtual scrolling for performance.
 * Supports sorting by title, priority, and due date, and inline status updates.
 */
export default function ListView({
  tasks,
  activeUsers,
  onSort,
  sortBy,
  sortDirection,
}: ListViewProps) {
  const updateTask = useTaskStore((state) => state.updateTask);

  // Virtual scrolling state and refs
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling configuration
  const rowHeight = 60; // Height of each table row in pixels
  const buffer = 5; // Number of extra rows to render outside visible area
  const containerHeight = 600; // Height of the scrollable container

  // Calculate which tasks are currently visible
  const visibleStart = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
  const visibleEnd = Math.min(
    tasks.length,
    visibleStart + Math.ceil(containerHeight / rowHeight) + buffer * 2,
  );
  const visibleTasks = tasks.slice(visibleStart, visibleEnd);
  const offsetY = visibleStart * rowHeight;

  /**
   * Handles scroll events to update the visible task range
   */
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  /**
   * Formats the due date display with appropriate styling
   */
  const getDueStatus = (dueDate: string) => {
    const today = dayjs();
    const due = dayjs(dueDate);
    const daysDifference = today.diff(due, "day");

    if (daysDifference === 0) return "Due Today";
    if (daysDifference > 7) return `${daysDifference} days overdue`;
    if (daysDifference > 0) return "Overdue";
    return dayjs(dueDate).format("MMM D, YYYY");
  };

  /**
   * Gets the list of active users currently viewing a specific task
   */
  const getActiveUsersForTask = (taskId: string) => {
    return activeUsers.filter((user) => user.taskId === taskId);
  };

  /**
   * Updates a task's status when the dropdown changes
   */
  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTask(taskId, { status: newStatus });
  };

  // Show empty state if no tasks match filters
  if (tasks.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-4">No tasks match your filters</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded shadow overflow-hidden">
        {/* Fixed header with sortable columns */}
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="p-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() =>
                  onSort(
                    "title",
                    sortBy === "title" && sortDirection === "asc"
                      ? "desc"
                      : "asc",
                  )
                }
              >
                Title{" "}
                {sortBy === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="p-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() =>
                  onSort(
                    "priority",
                    sortBy === "priority" && sortDirection === "asc"
                      ? "desc"
                      : "asc",
                  )
                }
              >
                Priority{" "}
                {sortBy === "priority" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-3 text-left">Assignee</th>
              <th className="p-3 text-left">Status</th>
              <th
                className="p-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() =>
                  onSort(
                    "dueDate",
                    sortBy === "dueDate" && sortDirection === "asc"
                      ? "desc"
                      : "asc",
                  )
                }
              >
                Due Date{" "}
                {sortBy === "dueDate" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="p-3 text-left">Active Users</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable body with virtual scrolling */}
        <div
          ref={containerRef}
          className="overflow-auto"
          style={{ height: containerHeight }}
          onScroll={handleScroll}
        >
          <table className="w-full">
            <tbody style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleTasks.map((task) => {
                const taskUsers = getActiveUsersForTask(task.id);
                return (
                  <tr
                    key={task.id}
                    className="border-t hover:bg-gray-50"
                    style={{ height: rowHeight }}
                  >
                    <td className="p-3">{task.title}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          task.priority === "critical"
                            ? "bg-red-500 text-white"
                            : task.priority === "high"
                              ? "bg-orange-500 text-white"
                              : task.priority === "medium"
                                ? "bg-yellow-500 text-black"
                                : "bg-green-500 text-white"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs">
                          {task.assignee[0]}
                        </div>
                        {task.assignee}
                      </div>
                    </td>
                    <td className="p-3">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.id, e.target.value)
                        }
                        className="border rounded p-1 text-sm"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="in-review">In Review</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="p-3 text-sm">
                      {getDueStatus(task.dueDate)}
                    </td>
                    <td className="p-3">
                      {taskUsers.length > 0 && (
                        <div className="flex gap-1">
                          {taskUsers.slice(0, 2).map((user) => (
                            <div
                              key={user.id}
                              className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs"
                            >
                              {user.name[0]}
                            </div>
                          ))}
                          {taskUsers.length > 2 && (
                            <div className="w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">
                              +{taskUsers.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Display current visible range */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {visibleStart + 1}-{Math.min(visibleEnd, tasks.length)} of{" "}
        {tasks.length} tasks
      </div>
    </div>
  );
}
