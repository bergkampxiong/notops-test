import api from '../services/auth';

interface SessionManagerOptions {
  defaultTimeout?: number; // 默认超时时间（分钟）
  warningTime?: number;    // 警告时间（秒）
  onTimeout?: () => void;  // 超时回调
  onWarning?: () => void;  // 警告回调
}

class SessionManager {
  private timeoutMinutes: number;
  private warningTimeSeconds: number;
  private timer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private onTimeout: () => void;
  private onWarning: () => void;
  private events: string[] = [
    'mousedown', 'mousemove', 'keypress', 
    'scroll', 'touchstart', 'click', 'keydown'
  ];
  private initialized: boolean = false;

  constructor(options: SessionManagerOptions = {}) {
    this.timeoutMinutes = options.defaultTimeout || 30;
    this.warningTimeSeconds = options.warningTime || 60;
    this.onTimeout = options.onTimeout || (() => console.log('Session timeout'));
    this.onWarning = options.onWarning || (() => console.log('Session warning'));
  }

  /**
   * 初始化会话管理器
   */
  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 检查是否已登录
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // 尝试从后端获取超时设置
        const timeout = await this.getTimeoutFromServer();
        if (timeout) {
          this.timeoutMinutes = timeout;
          console.log(`从服务器获取会话超时设置: ${this.timeoutMinutes}分钟`);
        } else {
          console.log(`使用默认会话超时设置: ${this.timeoutMinutes}分钟`);
        }
      } catch (error) {
        // 使用默认值
        console.log(`获取会话超时设置失败，使用默认值: ${this.timeoutMinutes}分钟`);
      }

      // 添加事件监听器
      this.addEventListeners();
      
      // 添加页面可见性变化监听
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      
      // 启动计时器
      this.resetTimer();
      
      this.initialized = true;
      console.log(`会话管理器已初始化，超时时间: ${this.timeoutMinutes}分钟，警告时间: ${this.warningTimeSeconds}秒`);
    } else {
      console.log('用户未登录，会话管理器不启动');
    }
  }

  /**
   * 停止会话管理器
   */
  public stop(): void {
    // 移除所有事件监听器
    this.events.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity);
    });
    
    // 移除页面可见性监听
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    // 清除计时器
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    this.initialized = false;
    console.log('会话管理器已停止');
  }

  /**
   * 添加用户活动事件监听器
   */
  private addEventListeners(): void {
    this.events.forEach(event => {
      document.addEventListener(event, this.handleUserActivity);
    });
  }

  /**
   * 处理用户活动
   */
  public handleUserActivity = (): void => {
    this.resetTimer();
  }

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      // 页面变为可见时，重置计时器
      this.resetTimer();
    }
  }

  /**
   * 重置计时器
   */
  private resetTimer(): void {
    // 清除现有计时器
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    // 计算超时和警告时间（毫秒）
    const timeoutMs = this.timeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - (this.warningTimeSeconds * 1000);
    
    // 设置警告计时器
    this.warningTimer = setTimeout(() => {
      this.onWarning();
    }, warningMs);
    
    // 设置超时计时器
    this.timer = setTimeout(() => {
      this.timeout();
    }, timeoutMs);
  }

  /**
   * 超时处理
   */
  private timeout(): void {
    this.onTimeout();
  }

  /**
   * 从服务器获取超时设置
   */
  private async getTimeoutFromServer(): Promise<number | null> {
    try {
      // 先尝试获取当前用户信息，确认是否有权限
      const userResponse = await api.get('/auth/me');
      const userRole = userResponse.data?.role;
      
      // 如果不是管理员，使用默认设置
      if (userRole !== 'Admin') {
        console.log('非管理员用户，使用默认会话超时设置');
        return null;
      }
      
      // 获取安全设置
      const response = await api.get('/security/settings');
      if (response.data && response.data.session_timeout_minutes) {
        return response.data.session_timeout_minutes;
      }
      return null;
    } catch (error: any) {
      // 如果是权限错误，静默处理
      if (error?.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('无权限获取安全设置，使用默认会话超时设置');
        return null;
      }
      console.error('获取安全设置失败:', error);
      return null;
    }
  }

  /**
   * 获取当前超时时间（分钟）
   */
  public getTimeoutMinutes(): number {
    return this.timeoutMinutes;
  }

  /**
   * 获取警告时间（秒）
   */
  public getWarningTimeSeconds(): number {
    return this.warningTimeSeconds;
  }
}

export default SessionManager; 