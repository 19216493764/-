// 主应用逻辑
class PrinterMonitorApp {
    constructor() {
        this.bluetoothManager = new BluetoothManager();
        this.printerController = new PrinterController(this.bluetoothManager);
        this.dataManager = new DataManager();
        
        this.connectionCount = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initTabs();
        this.initMockData();
        
        // 监听数据接收事件
        document.addEventListener('dataReceived', (event) => {
            this.dataManager.addData(event.detail);
            this.parseStatusResponse(event.detail.rawData);
            this.updateLastActivity();
        });
    }

    bindEvents() {
        // 连接控制
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('refreshStatusBtn').addEventListener('click', () => this.queryStatus());
        
        // 数据操作
        document.getElementById('saveBtn').addEventListener('click', () => this.saveData());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearData());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('testBtn').addEventListener('click', () => this.sendTestData());
        
        // 打印机命令
        document.getElementById('statusQueryBtn').addEventListener('click', () => this.queryStatus());
        document.getElementById('feedPaperBtn').addEventListener('click', () => this.feedPaper());
        document.getElementById('cutPaperBtn').addEventListener('click', () => this.cutPaper());
        document.getElementById('resetPrinterBtn').addEventListener('click', () => this.resetPrinter());
        document.getElementById('beepBtn').addEventListener('click', () => this.beep());
        document.getElementById('printTestBtn').addEventListener('click', () => this.printTest());
    }

    initTabs() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
            });
        });
    }

    async connect() {
        const success = await this.bluetoothManager.connect();
        if (success) {
            this.connectionCount++;
            document.getElementById('connectionCount').textContent = this.connectionCount;
            this.updateUIState(true);
            this.updatePrinterStatus('online');
            
            // 更新设备信息
            document.getElementById('deviceName').textContent = 
                this.bluetoothManager.device?.name || "Mini-Printer";
            
            setTimeout(() => this.queryStatus(), 1000);
        } else {
            this.updateUIState(false);
            this.updatePrinterStatus('offline');
        }
    }

    disconnect() {
        this.bluetoothManager.disconnect();
        this.updateUIState(false);
        this.updatePrinterStatus('offline');
    }

    updateUIState(connected) {
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const refreshBtn = document.getElementById('refreshStatusBtn');
        const dataBtns = ['saveBtn', 'clearBtn', 'exportBtn', 'testBtn'];
        
        connectBtn.disabled = connected;
        disconnectBtn.disabled = !connected;
        refreshBtn.disabled = !connected;
        
        dataBtns.forEach(btn => {
            document.getElementById(btn).disabled = !connected;
        });
        
        this.enableCommandButtons(connected);
    }

    enableCommandButtons(enabled) {
        const buttons = ['statusQueryBtn', 'feedPaperBtn', 'cutPaperBtn', 'resetPrinterBtn', 'beepBtn', 'printTestBtn'];
        buttons.forEach(btn => {
            document.getElementById(btn).disabled = !enabled;
        });
    }

    async queryStatus() {
        try {
            await this.printerController.queryStatus();
        } catch (error) {
            this.dataManager.addError();
            alert('查询状态失败: ' + error.message);
        }
    }

    async feedPaper() {
        try {
            await this.printerController.feedPaper();
        } catch (error) {
            this.dataManager.addError();
            alert('进纸失败: ' + error.message);
        }
    }

    async cutPaper() {
        try {
            await this.printerController.cutPaper();
        } catch (error) {
            this.dataManager.addError();
            alert('切纸失败: ' + error.message);
        }
    }

    async resetPrinter() {
        try {
            await this.printerController.resetPrinter();
        } catch (error) {
            this.dataManager.addError();
            alert('复位失败: ' + error.message);
        }
    }

    async beep() {
        try {
            await this.printerController.beep();
        } catch (error) {
            this.dataManager.addError();
            alert('蜂鸣器控制失败: ' + error.message);
        }
    }

    async printTest() {
        try {
            await this.printerController.printTest();
        } catch (error) {
            this.dataManager.addError();
            alert('打印测试页失败: ' + error.message);
        }
    }

    async sendTestData() {
        const testData = '=== 测试打印 ===\n时间: ' + new Date().toLocaleString() + '\n设备: Mini-Printer\n================\n\n';
        try {
            await this.bluetoothManager.sendData(testData);
            alert('测试数据发送成功！');
        } catch (error) {
            this.dataManager.addError();
            alert('发送测试数据失败: ' + error.message);
        }
    }

    saveData() {
        if (this.dataManager.receivedData.length === 0) {
            alert('没有数据可保存');
            return;
        }
        
        const count = this.dataManager.saveToLocalStorage();
        alert(`数据已保存，共 ${count} 条记录`);
    }

    clearData() {
        if (confirm('确定要清空所有接收到的数据吗？')) {
            this.dataManager.clearData();
        }
    }

    exportData() {
        if (this.dataManager.receivedData.length === 0) {
            alert('没有数据可导出');
            return;
        }
        
        const dataStr = this.dataManager.exportToJSON();
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mini_printer_data_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    parseStatusResponse(data) {
        if (data.length > 0 && data[0] === 0x10) {
            const paperOk = (data[1] & 0x01) === 0;
            const temperature = data[2];
            const battery = Math.min(100, Math.max(0, data[3] || 80));
            
            document.getElementById('paperStatus').textContent = paperOk ? '正常' : '缺纸';
            document.getElementById('paperStatus').className = `status-value ${paperOk ? 'status-online' : 'status-warning'}`;
            document.getElementById('headTemperature').textContent = `${temperature}°C`;
            document.getElementById('batteryLevel').textContent = `${battery}%`;
        }
    }

    updatePrinterStatus(status) {
        const element = document.getElementById('printerConnectionStatus');
        element.textContent = status === 'online' ? '在线' : '离线';
        element.className = `status-value ${status === 'online' ? 'status-online' : 'status-offline'}`;
    }

    updateLastActivity() {
        document.getElementById('lastActivity').textContent = new Date().toLocaleString();
    }

    initMockData() {
        // 初始化一些模拟数据
        document.getElementById('paperStatus').textContent = '正常';
        document.getElementById('headTemperature').textContent = '45°C';
        document.getElementById('batteryLevel').textContent = '85%';
        document.getElementById('printedPages').textContent = '42';
        document.getElementById('firmwareVersion').textContent = 'V1.2.3';
    }
}

// 检查浏览器支持并启动应用
if (!navigator.bluetooth) {
    alert('您的浏览器不支持Web蓝牙API，请使用Chrome、Edge或Opera浏览器');
} else {
    // 启动应用
    const app = new PrinterMonitorApp();
}