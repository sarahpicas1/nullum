export interface DecisionPayload {
  decisionId: string;
  decisionType: string;
  modelUsed: string;
  inputs: Record<string, unknown>;
  output: string;
  confidence: number;
  submittedBy: string;
}

export interface AuditReceipt {
  success: true;
  auditId: string;
  hcsTopicId: string;
  hcsSequenceNumber: number;
  nftTokenId: string;
  nftSerial: number;
  paymentTxId: string;
  hbarPaid: number;
  usdEquivalent: 0.50;
  priceSource: string;
  explorerUrl: string;
  timestamp: string;
}

export interface AuditError {
  success: false;
  error: string;
  failedStep: string;
}

export type AuditResult = AuditReceipt | AuditError;

export interface HCSLogEntry {
  version: "1.0";
  decisionId: string;
  decisionHash: string;
  paymentTxId: string;
  nftTokenId: string;
  nftSerial: number;
  timestamp: string;
  modelUsed: string;
  decisionType: string;
  confidence: number;
  submittedBy: string;
  auditFeeHbar: number;
  auditFeeUsd: 0.50;
  priceSource: string;
}

export interface AgentRequest {
  type: "audit" | "chat";
  payload?: DecisionPayload;
  message?: string;
  sessionId?: string;
}

export interface AgentResponse {
  type: "audit" | "chat";
  receipt?: AuditReceipt;
  message?: string;
  error?: string;
}

export interface HbarPriceResponse {
  data: {
    id: string;
    symbol: string;
    priceUsd: string;
  };
}
