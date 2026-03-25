import type { Task } from "../types/task";
import dayjs from "dayjs";

interface TimelineViewProps {
  tasks: Task[];
  activeUsers: { id: string; name: string; taskId?: string }[];
}

/**
 * TimelineView displays tasks in a Gantt chart format showing their duration and due dates.
 * Tasks are shown as horizontal bars spanning from start date to due date.
 */
export default function TimelineView({
  tasks,
  activeUsers,
}: TimelineViewProps) {
  // Timeline configuration
  const currentMonth = dayjs().startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const dayWidth = window.innerWidth < 640 ? 30 : 40; // 30px on mobile, 40px on larger screens

  /**
   * Calculates the horizontal position of a date on the timeline
   */
  const getPosition = (date: string) => {
    const dateObj = dayjs(date);
    const dayOfMonth = dateObj.date();
    return (dayOfMonth - 1) * dayWidth;
  };

  /**
   * Calculates the width of a task bar based on its duration
   */
  const getWidth = (startDate?: string, dueDate?: string) => {
    if (!startDate) return dayWidth; // single day task

    const start = dayjs(startDate);
    const end = dayjs(dueDate);
    const days = end.diff(start, "day") + 1; // +1 to include both start and end dates
    return Math.max(days * dayWidth, dayWidth); // minimum width of one day
  };

  /**
   * Gets the list of active users currently viewing a specific task
   */
  const getActiveUsersForTask = (taskId: string) => {
    return activeUsers.filter((user) => user.taskId === taskId);
  };

  // Filter tasks to only show those in the current month
  const timelineTasks = tasks.filter((task) => {
    const due = dayjs(task.dueDate);
    return (
      due.isSame(currentMonth, "month") ||
      (task.startDate && dayjs(task.startDate).isSame(currentMonth, "month"))
    );
  });

  return (
    <div className="p-2 sm:p-6">
      {/* Timeline header showing current month - responsive */}
      <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4">
        {currentMonth.format("MMMM YYYY")}
      </h2>

      <div className="relative bg-white rounded shadow p-2 sm:p-4 overflow-x-auto">
        {/* Calendar header with day numbers - responsive */}
        <div className="flex mb-2 sm:mb-4 border-b pb-2 min-w-max">
          <div className="w-24 sm:w-32 flex-shrink-0"></div>{" "}
          {/* Space for task names - responsive width */}
          <div className="flex">
            {Array.from({ length: daysInMonth }, (_, i) => (
              <div
                key={i}
                className="text-center text-xs sm:text-sm text-gray-600"
                style={{ width: dayWidth }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Vertical line indicating today's date - responsive positioning */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{
            left: `${(window.innerWidth < 640 ? 24 : 32) + getPosition(dayjs().format("YYYY-MM-DD")) + dayWidth / 2}px`,
          }}
        ></div>

        {/* Task rows - responsive */}
        <div className="space-y-1 sm:space-y-2">
          {timelineTasks.map((task) => {
            // Calculate positioning for the task bar
            const left =
              (window.innerWidth < 640 ? 96 : 128) +
              getPosition(task.startDate || task.dueDate);
            const width = getWidth(task.startDate, task.dueDate);
            const taskUsers = getActiveUsersForTask(task.id);

            return (
              <div key={task.id} className="flex items-center min-w-max">
                {/* Task name column - responsive */}
                <div className="w-24 sm:w-32 flex-shrink-0 text-xs sm:text-sm font-medium pr-2 sm:pr-4 truncate">
                  {task.title}
                </div>

                {/* Timeline area - responsive */}
                <div
                  className="relative flex-1"
                  style={{ height: window.innerWidth < 640 ? 32 : 40 }}
                >
                  <div
                    className={`absolute top-0 h-6 sm:h-8 rounded flex items-center px-1 sm:px-2 text-xs text-white ${
                      task.priority === "critical"
                        ? "bg-red-500"
                        : task.priority === "high"
                          ? "bg-orange-500"
                          : task.priority === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                    }`}
                    style={{ left: `${left}px`, width: `${width}px` }}
                  >
                    {/* Task title inside the bar - responsive */}
                    <span className="truncate text-xs sm:text-xs">
                      {task.title}
                    </span>

                    {/* Active users indicator - responsive */}
                    {taskUsers.length > 0 && (
                      <div className="ml-1 sm:ml-2 flex gap-1">
                        {taskUsers.slice(0, 2).map((user) => (
                          <div
                            key={user.id}
                            className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded-full flex items-center justify-center text-xs"
                          >
                            {user.name[0]}
                          </div>
                        ))}
                        {taskUsers.length > 2 && (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs">
                            +{taskUsers.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
