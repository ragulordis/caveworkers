import { getWorkspaceRecordsForUser } from "../db";
import { getDemoWorkspace, type WorkspaceOverview, type WorkspaceTaskState } from "./demo";

const taskStates: Record<string, WorkspaceTaskState> = {
  backlog: "Planning", planning: "Planning", in_progress: "In progress", waiting: "Planning", review: "Review", completed: "Complete", blocked: "Planning",
};

/** Converts normalized database records to the stable, user-safe workspace read model. */
export async function getWorkspaceOverviewForUser(userId?: number): Promise<WorkspaceOverview> {
  if (!userId) return getDemoWorkspace();
  const records = await getWorkspaceRecordsForUser(userId);
  if (!records || !records.employee) return getDemoWorkspace();
  return {
    company: { id: String(records.company.id), name: records.company.name, description: records.company.description ?? "", industry: records.company.industry ?? "", goals: records.company.goals ?? "" },
    employee: { id: String(records.employee.id), name: records.employee.name, role: records.employee.role, status: "working", model: records.employee.model, currentTaskId: records.tasks[0] ? `CW-${records.tasks[0].id}` : "", toolPermissions: records.employee.toolPermissions },
    messages: records.messages.map((message) => {
      const sender = message.senderEmployeeId ? records.employees.find((employee) => employee.id === message.senderEmployeeId) : undefined;
      return { id: String(message.id), sender: message.senderType, content: message.content, createdAt: message.createdAt.getTime(), messageType: message.messageType, employeeName: sender?.name, employeeKey: sender?.key };
    }),
    tasks: records.tasks.map((task) => ({ id: `CW-${task.id}`, title: task.title, state: taskStates[task.status], progress: task.progress, updatedAt: task.updatedAt.getTime(), detail: task.description ?? "No detail recorded yet.", tags: [task.status.replace("_", " ")] })),
    memory: [
      ...(records.company.industry ? [{ id: `company-industry-${records.company.id}`, category: "company context", title: "Industry", value: records.company.industry }] : []),
      ...records.context.map((item) => ({ id: String(item.id), category: item.category.replaceAll("_", " "), title: item.title, value: item.value })),
    ],
    documents: records.documents.map((document) => ({ id: String(document.id), name: document.originalName, contentType: document.contentType, sizeBytes: document.sizeBytes, createdAt: document.createdAt.getTime() })),
    events: records.events.map((event) => ({ id: String(event.id), action: event.action, summary: event.summary, status: event.status === "started" ? "started" as const : "completed" as const, createdAt: event.createdAt.getTime() })),
  };
}
