// 蓝牙连接管理，使用web BLU 开启硬件连接
class BluetoothManager {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        this.config = {
            DEVICE_NAME: "Printer",
            SERVICE_UUID: "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
            CHARACTERISTIC_UUID: "beb5483e-36e1-4688-b7f5-ea07361b26a8"
        };
    }

    async connect() {
        try {
            this.updateStatus('searching', '搜索Mini-Printer设备中...');
            
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ name: this.config.DEVICE_NAME }],
                optionalServices: [this.config.SERVICE_UUID]
            });
            
            this.updateStatus('searching', '连接设备中...');
            
            this.server = await this.device.gatt.connect();
            this.service = await this.server.getPrimaryService(this.config.SERVICE_UUID);
            this.characteristic = await this.service.getCharacteristic(this.config.CHARACTERISTIC_UUID);
            
            this.characteristic.addEventListener('characteristicvaluechanged', this.handleDataReceived.bind(this));
            await this.characteristic.startNotifications();
            
            this.isConnected = true;
            this.updateStatus('connected', `已连接: ${this.device.name || this.config.DEVICE_NAME}`);
            
            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
            
            return true;
        } catch (error) {
            console.error('连接失败:', error);
            this.updateStatus('disconnected', error.name === 'NotFoundError' ? 
                '未找到Mini-Printer设备' : `连接失败: ${error.message}`);
            return false;
        }
    }

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.onDisconnected();
    }

    onDisconnected() {
        this.isConnected = false;
        this.updateStatus('disconnected', '设备已断开');
        
        if (this.characteristic) {
            this.characteristic.removeEventListener('characteristicvaluechanged', this.handleDataReceived);
        }
        
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
    }

    handleDataReceived(event) {
        const value = event.target.value;
        const data = new Uint8Array(value.buffer);
        const dataString = new TextDecoder().decode(data);
        const hexString = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ');
        
        // 触发数据接收事件
        const dataEvent = new CustomEvent('dataReceived', {
            detail: {
                timestamp: new Date().toLocaleString(),
                data: dataString,
                hex: hexString,
                bytes: data.length,
                rawData: data
            }
        });
        document.dispatchEvent(dataEvent);
    }

    async sendData(data) {
        if (!this.characteristic) {
            throw new Error('未连接到设备');
        }
        
        const dataArray = typeof data === 'string' ? 
            new TextEncoder().encode(data) : new Uint8Array(data);
        
        await this.characteristic.writeValue(dataArray);
    }

    updateStatus(status, text) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        statusDot.className = 'status-dot ' + status;
        statusText.textContent = text;
    }
}