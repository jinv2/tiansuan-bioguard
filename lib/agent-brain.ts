export type AgentState = 'STANDBY' | 'ACTIVE' | 'ALERT';
interface PerceptionData {
  movement: boolean;
  hasPerson: boolean;
  posture: 'standing' | 'sitting' | 'fallen' | 'unknown';
  timestamp: number;
}
export class BioGuardAgent {
  private state: AgentState = 'STANDBY';
  private memory: PerceptionData[] = [];
  public perceive(data: PerceptionData): AgentState {
    this.memory.push(data);
    if (this.memory.length > 10) this.memory.shift();
    return this.reason();
  }
  private reason(): AgentState {
    const lastFrame = this.memory[this.memory.length - 1];
    if (lastFrame.posture === 'fallen') {
      this.state = 'ALERT';
      return 'ALERT';
    }
    if (lastFrame.hasPerson && lastFrame.movement) {
      this.state = 'ACTIVE';
      return 'ACTIVE';
    }
    this.state = 'STANDBY';
    return 'STANDBY';
  }
}
export const agentInstance = new BioGuardAgent();
