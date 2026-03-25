import { useState } from "react";
import { useTaskStore } from "../store/taskStore";
import type { Task } from "../types/task";
import dayjs from "dayjs";

interface KanbanViewProps {
  tasks: Task[];
  activeUsers: { id: string; name: string; taskId?: string }[];
}

/**
 * KanbanView displays tasks in a traditional kanban board layout with columns for each status.
 * Supports drag-and-drop to move tasks between columns.
 */
export default function KanbanView({ tasks, activeUsers }: KanbanViewProps) {
  const updateTask = useTaskStore((state) => state.updateTask);

  // State for drag and drop functionality
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  // Define our kanban columns
  const columns = [
    {
      id: "todo",
      title: "To Do",
      tasks: tasks.filter((task) => task.status === "todo"),
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: tasks.filter((task) => task.status === "in-progress"),
    },
    {
      id: "in-review",
      title: "In Review",
      tasks: tasks.filter((task) => task.status === "in-review"),
    },
    {
      id: "done",
      title: "Done",
      tasks: tasks.filter((task) => task.status === "done"),
    },
  ];

  /**
   * Determines the display text and color for a task's due date
   */
  const getDueStatus = (dueDate: string) => {
    const today = dayjs();
    const due = dayjs(dueDate);
    const daysDifference = today.diff(due, "day");

    if (daysDifference === 0) {
      return { dueText: "Due Today", color: "text-blue-600" };
    } else if (daysDifference > 7) {
      return {
        dueText: `${daysDifference} days overdue`,
        color: "text-red-600",
      };
    } else if (daysDifference > 0) {
      return { dueText: "Overdue", color: "text-red-600" };
    } else {
      return {
        dueText: `Due: ${dayjs(dueDate).format("MMM D")}`,
        color: "text-gray-600",
      };
    }
  };

  /**
   * Handles the start of a drag operation
   */
  const handlePointerDown = (e: React.PointerEvent, task: Task) => {
    setDraggedTask(task);
    setDragPosition({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  /**
   * Updates the drag position as the user moves the mouse/finger
   */
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedTask) return;
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  /**
   * Handles the end of a drag operation - either drop the task or cancel
   */
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggedTask) return;

    // Check if we dropped on a valid column
    const dropTarget = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[data-column]");
    if (dropTarget) {
      const newStatus = dropTarget.getAttribute("data-column");
      if (newStatus && newStatus !== draggedTask.status) {
        // Update the task's status in our store
        updateTask(draggedTask.id, { status: newStatus });
      }
    }

    // Clean up drag state
    setDraggedTask(null);
    setHoveredColumn(null);
  };

  /**
   * Gets the list of active users currently viewing a specific task
   */
  const getActiveUsersForTask = (taskId: string) => {
    return activeUsers.filter((user) => user.taskId === taskId);
  };

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <div className="flex flex-col md:flex-row gap-4 p-2 sm:p-4 lg:p-6">
          {columns.map((column) => (
            <div
              key={column.id}
              data-column={column.id}
              className={`w-full md:w-[320px] lg:w-64 flex-shrink-0 bg-gray-200 p-3 lg:p-4 rounded-lg min-h-[24rem] sm:min-h-[26rem] ${
                hoveredColumn === column.id ? "bg-blue-100" : ""
              }`}
              onPointerEnter={() => setHoveredColumn(column.id)}
              onPointerLeave={() => setHoveredColumn(null)}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold text-sm lg:text-base truncate">
                  {column.title}
                </h3>
                <span className="text-xs text-gray-600">
                  {column.tasks.length}
                </span>
              </div>
              <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
                {" "}
                {column.tasks.length === 0 ? (
                  <div className="text-gray-500 text-center py-6 lg:py-8 text-sm">
                    No tasks in {column.title.toLowerCase()}
                  </div>
                ) : (
                  column.tasks.map((task) => {
                    if (draggedTask?.id === task.id) {
                      // Show a placeholder while dragging
                      return (
                        <div
                          key={task.id}
                          className="bg-gray-300 p-3 rounded opacity-50"
                          style={{ height: "80px" }}
                        >
                          Placeholder
                        </div>
                      );
                    }

                    const { dueText, color } = getDueStatus(task.dueDate);
                    const taskUsers = getActiveUsersForTask(task.id);

                    return (
                      <div
                        key={task.id}
                        className="bg-white p-3 rounded shadow cursor-move select-none hover:shadow-md transition-shadow"
                        onPointerDown={(e) => handlePointerDown(e, task)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                      >
                        <p className="font-semibold mb-2 text-sm lg:text-base">
                          {task.title}
                        </p>
                        <div className="flex justify-between items-center mb-2">
                          <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs">
                            {task.assignee[0]}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
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
                        </div>
                        <p className={`text-xs ${color} mb-2`}>{dueText}</p>
                        {taskUsers.length > 0 && (
                          <div className="flex gap-1">
                            {taskUsers.slice(0, 3).map((user) => (
                              <div
                                key={user.id}
                                className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs"
                              >
                                {user.name[0]}
                              </div>
                            ))}
                            {taskUsers.length > 3 && (
                              <div className="w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">
                                +{taskUsers.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Render the dragged task as a floating element */}
      {draggedTask && (
        <div
          className="fixed bg-white p-3 rounded shadow-lg pointer-events-none z-50"
          style={{
            left: dragPosition.x - 100,
            top: dragPosition.y - 20,
            transform: "rotate(5deg)",
            boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
          }}
        >
          <p className="font-semibold mb-2">{draggedTask.title}</p>
          <div className="flex justify-between items-center mb-2">
            <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs">
              {draggedTask.assignee[0]}
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                draggedTask.priority === "critical"
                  ? "bg-red-500 text-white"
                  : draggedTask.priority === "high"
                    ? "bg-orange-500 text-white"
                    : draggedTask.priority === "medium"
                      ? "bg-yellow-500 text-black"
                      : "bg-green-500 text-white"
              }`}
            >
              {draggedTask.priority}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
