// 打印机控制命令
class PrinterController {
    constructor(bluetoothManager) {
        this.bluetooth = bluetoothManager;
        this.commands = {
            QUERY_STATUS: [0x10, 0x04, 0x01],
            FEED_PAPER: [0x1B, 0x64, 0x03],
            CUT_PAPER: [0x1D, 0x56, 0x00],
            RESET: [0x1B, 0x40],
            BEEP: [0x1B, 0x42, 0x03, 0x01],
            PRINT_TEST: [0x12, 0x54]
        };
        
        this.sentCommands = [];
    }

    async sendCommand(command, commandName) {
        try {
            await this.bluetooth.sendData(command);
            
            this.sentCommands.push({
                timestamp: new Date().toLocaleString(),
                command: commandName,
                hex: Array.from(command).map(b => b.toString(16).padStart(2, '0')).join(' '),
                bytes: command.length
            });
            
            this.updateCommandDisplay();
            return true;
        } catch (error) {
            console.error('发送命令失败:', error);
            throw error;
        }
    }

    async queryStatus() {
        return await this.sendCommand(this.commands.QUERY_STATUS, '查询状态');
    }

    async feedPaper() {
        return await this.sendCommand(this.commands.FEED_PAPER, '进纸');
    }

    async cutPaper() {
        return await this.sendCommand(this.commands.CUT_PAPER, '切纸');
    }

    async resetPrinter() {
        return await this.sendCommand(this.commands.RESET, '复位');
    }

    async beep() {
        return await this.sendCommand(this.commands.BEEP, '蜂鸣器');
    }

    async printTest() {
        return await this.sendCommand(this.commands.PRINT_TEST, '测试页');
    }

    updateCommandDisplay() {
        const commandContainer = document.getElementById('commandContainer');
        
        if (this.sentCommands.length === 0) {
            commandContainer.innerHTML = '<div class="empty-data">暂无命令记录</div>';
            return;
        }
        
        commandContainer.innerHTML = '';
        this.sentCommands.slice(-10).forEach((item) => {
            const commandElement = document.createElement('div');
            commandElement.className = 'data-item';
            commandElement.style.borderLeftColor = '#2ecc71';
            commandElement.innerHTML = `
                <div class="data-header">
                    <span class="data-time">${item.timestamp}</span>
                    <span class="data-length">${item.bytes} 字节</span>
                </div>
                <div class="data-content">命令: ${item.command}</div>
                <div class="hex-data">HEX: ${item.hex}</div>
            `;
            commandContainer.appendChild(commandElement);
        });
        
        commandContainer.scrollTop = commandContainer.scrollHeight;
    }
}