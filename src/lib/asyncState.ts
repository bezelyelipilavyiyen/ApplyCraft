export interface ActionState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}
