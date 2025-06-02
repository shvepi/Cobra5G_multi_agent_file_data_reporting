"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validTestFiles = void 0;
exports.validTestFiles = [
    {
        fileContent: {
            host: "EDGE_PC1",
            installed_softwares: ["sql", "pip", "python"],
        },
        fileDataType: "Proprietary",
        fileReadyTime: "2023-11-02T00:00:00+01:00",
    },
    {
        fileContent: {
            host: "EDGE_PC2",
            ip_addr: "192.168.0.2",
        },
        fileDataType: "Proprietary",
        fileReadyTime: "2023-11-01T00:00:00+01:00",
    },
    {
        fileContent: {
            host: "EDGE_PC",
            cpu_util: 80,
        },
        fileDataType: "Performance",
        fileReadyTime: "2023-11-01T00:00:00+01:00",
    },
    {
        fileContent: {
            host: "EDGE_PC",
            installed_softwares: ["sql", "pip", "python"],
        },
        fileDataType: "Performance",
        fileReadyTime: "2023-11-01T00:00:00+01:00",
    },
    {
        fileContent: {
            numOfRequests: 100,
            numOfErrors: 10,
        },
        fileDataType: "Analytics",
        fileReadyTime: "2023-11-01T00:00:00+01:00",
    },
    {
        fileContent: {
            1705143603: {
                fileDataReporting: ["new file with ID 1", "new file with ID 2"],
            },
        },
        fileDataType: "Trace",
        fileReadyTime: "2023-11-01T00:00:00+01:00",
    },
];
