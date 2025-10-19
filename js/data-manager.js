// 数据存储和管理
class DataManager {
    constructor() {
        this.receivedData = [];
        this.totalBytes = 0;
        this.errorCount = 0;
        this.successCount = 0;
        this.startTime = Date.now();
    }

    addData(data) {
        this.receivedData.push(data);
        this.totalBytes += data.bytes;
        this.successCount++;
        
        this.updateStatistics();
        this.updateDataDisplay();
    }

    clearData() {
        this.receivedData = [];
        this.totalBytes = 0;
        this.updateStatistics();
        this.updateDataDisplay();
    }

    addError() {
        this.errorCount++;
        this.updateStatistics();
    }

    updateStatistics() {
        document.getElementById('dataCount').textContent = this.receivedData.length;
        document.getElementById('totalBytes').textContent = this.totalBytes;
        document.getElementById('errorCount').textContent = this.errorCount;
        
        const total = this.successCount + this.errorCount;
        const rate = total > 0 ? Math.round((this.successCount / total) * 100) : 100;
        document.getElementById('successRate').textContent = `${rate}%`;
        
        const minutes = Math.floor((Date.now() - this.startTime) / 60000);
        document.getElementById('uptime').textContent = minutes;
    }

    updateDataDisplay() {
        const dataContainer = document.getElementById('dataContainer');
        
        if (this.receivedData.length === 0) {
            dataContainer.innerHTML = '<div class="empty-data">暂无数据</div>';
            return;
        }
        
        dataContainer.innerHTML = '';
        this.receivedData.slice(-20).forEach((item) => {
            const dataElement = document.createElement('div');
            dataElement.className = 'data-item';
            dataElement.innerHTML = `
                <div class="data-header">
                    <span class="data-time">${item.timestamp}</span>
                    <span class="data-length">${item.bytes} 字节</span>
                </div>
                <div class="data-content">${item.data || '[二进制数据]'}</div>
                <div class="hex-data">HEX: ${item.hex}</div>
            `;
            dataContainer.appendChild(dataElement);
        });
        
        dataContainer.scrollTop = dataContainer.scrollHeight;
    }

    saveToLocalStorage() {
        const dataToSave = {
            timestamp: new Date().toISOString(),
            device: "Mini-Printer",
            data: this.receivedData
        };
        
        let storedData = JSON.parse(localStorage.getItem('miniPrinterData') || '[]');
        storedData.push(dataToSave);
        localStorage.setItem('miniPrinterData', JSON.stringify(storedData));
        
        return this.receivedData.length;
    }

    exportToJSON() {
        const exportData = {
            exportTime: new Date().toISOString(),
            device: "Mini-Printer",
            totalPackets: this.receivedData.length,
            totalBytes: this.totalBytes,
            data: this.receivedData
        };
        
        return JSON.stringify(exportData, null, 2);
    }
}