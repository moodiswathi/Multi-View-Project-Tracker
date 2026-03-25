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
  const dayWidth = 40; // pixels per day - adjust this to fit more/less days

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
    <div className="p-6">
      {/* Timeline header showing current month */}
      <h2 className="text-xl font-bold mb-4">
        {currentMonth.format("MMMM YYYY")}
      </h2>

      <div className="relative bg-white rounded shadow p-4 overflow-x-auto">
        {/* Calendar header with day numbers */}
        <div className="flex mb-4 border-b pb-2">
          <div className="w-32 flex-shrink-0"></div>{" "}
          {/* Space for task names */}
          <div className="flex">
            {Array.from({ length: daysInMonth }, (_, i) => (
              <div
                key={i}
                className="w-10 text-center text-sm text-gray-600"
                style={{ width: dayWidth }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Vertical line indicating today's date */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{
            left: `${32 + getPosition(dayjs().format("YYYY-MM-DD")) + dayWidth / 2}px`,
          }}
        ></div>

        {/* Task rows */}
        <div className="space-y-2">
          {timelineTasks.map((task) => {
            // Calculate positioning for the task bar
            const left = 128 + getPosition(task.startDate || task.dueDate);
            const width = getWidth(task.startDate, task.dueDate);
            const taskUsers = getActiveUsersForTask(task.id);

            return (
              <div key={task.id} className="flex items-center">
                {/* Task name column */}
                <div className="w-32 flex-shrink-0 text-sm font-medium pr-4">
                  {task.title}
                </div>

                {/* Timeline area */}
                <div className="relative flex-1" style={{ height: 40 }}>
                  <div
                    className={`absolute top-0 h-8 rounded flex items-center px-2 text-xs text-white ${
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
                    {/* Task title inside the bar */}
                    <span className="truncate">{task.title}</span>

                    {/* Active users indicator */}
                    {taskUsers.length > 0 && (
                      <div className="ml-2 flex gap-1">
                        {taskUsers.slice(0, 2).map((user) => (
                          <div
                            key={user.id}
                            className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-xs"
                          >
                            {user.name[0]}
                          </div>
                        ))}
                        {taskUsers.length > 2 && (
                          <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs">
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
