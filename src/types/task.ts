export type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
  startDate?: string;
};