import dayjs from 'dayjs';

/**
 * Generates a large set of sample tasks for testing the application.
 * Creates 500 tasks with realistic titles, random assignments, and varied dates.
 */
export function generateTasks() {
  const allTasks = [];

  // Define the possible values for our task properties
  const possibleStatuses = ["todo", "in-progress", "in-review", "done"];
  const possiblePriorities = ["critical", "high", "medium", "low"];
  const teamMembers = ["Swathi", "Ravi", "Anil", "Priya", "Kiran", "Meera"];

  // A collection of realistic task titles that might appear in a software project
  const taskTitles = [
    "Implement user authentication",
    "Design database schema",
    "Create API endpoints",
    "Build responsive UI",
    "Optimize performance",
    "Write unit tests",
    "Deploy to production",
    "Fix bug in login",
    "Add new feature",
    "Refactor code",
    "Update documentation",
    "Conduct code review",
    "Setup CI/CD pipeline",
    "Monitor application",
    "Handle error cases",
    "Improve accessibility",
    "Add internationalization",
    "Integrate third-party API",
    "Create admin dashboard",
    "Implement caching",
    "Setup logging",
    "Add search functionality",
    "Create user profiles",
    "Implement notifications",
    "Add data validation",
    "Optimize queries",
    "Create backup system",
    "Implement security measures",
    "Add analytics tracking",
    "Create user guide",
  ];

  // Generate 500 tasks
  for (let taskNumber = 1; taskNumber <= 500; taskNumber++) {
    // Create some variety in due dates - some past, some future
    const daysOffset = Math.floor(Math.random() * 60) - 30; // Random between -30 and +30 days
    const dueDate = dayjs().add(daysOffset, 'day').format('YYYY-MM-DD');

    // Most tasks should have a start date, but not all
    const shouldHaveStartDate = Math.random() > 0.3; // 70% chance
    let startDate = undefined;

    if (shouldHaveStartDate) {
      // Start date should be before due date
      const daysBeforeDue = Math.floor(Math.random() * 10) + 1; // 1-10 days before
      startDate = dayjs(dueDate).subtract(daysBeforeDue, 'day').format('YYYY-MM-DD');
    }

    // Pick random values for other properties
    const randomTitle = taskTitles[Math.floor(Math.random() * taskTitles.length)];
    const randomStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
    const randomPriority = possiblePriorities[Math.floor(Math.random() * possiblePriorities.length)];
    const randomAssignee = teamMembers[Math.floor(Math.random() * teamMembers.length)];

    // Create the task object
    const newTask = {
      id: taskNumber.toString(),
      title: `${randomTitle} ${taskNumber}`, // Add number to make titles unique
      status: randomStatus,
      priority: randomPriority,
      assignee: randomAssignee,
      dueDate: dueDate,
      startDate: startDate,
    };

    allTasks.push(newTask);
  }

  return allTasks;
}