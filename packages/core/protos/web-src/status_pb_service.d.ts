// package: status
// file: status.proto

import * as status_pb from './status_pb'
import { grpc } from '@improbable-eng/grpc-web'

type StatusGetStatus = {
  readonly methodName: string
  readonly service: typeof Status
  readonly requestStream: false
  readonly responseStream: false
  readonly requestType: typeof status_pb.StatusRequest
  readonly responseType: typeof status_pb.StatusResponse
}

export class Status {
  static readonly serviceName: string
  static readonly GetStatus: StatusGetStatus
}

export type ServiceError = { message: string; code: number; metadata: grpc.Metadata }
export type Status = { details: string; code: number; metadata: grpc.Metadata }

interface UnaryResponse {
  cancel(): void
}
interface ResponseStream<T> {
  cancel(): void
  on(type: 'data', handler: (message: T) => void): ResponseStream<T>
  on(type: 'end', handler: (status?: Status) => void): ResponseStream<T>
  on(type: 'status', handler: (status: Status) => void): ResponseStream<T>
}
interface RequestStream<T> {
  write(message: T): RequestStream<T>
  end(): void
  cancel(): void
  on(type: 'end', handler: (status?: Status) => void): RequestStream<T>
  on(type: 'status', handler: (status: Status) => void): RequestStream<T>
}
interface BidirectionalStream<ReqT, ResT> {
  write(message: ReqT): BidirectionalStream<ReqT, ResT>
  end(): void
  cancel(): void
  on(type: 'data', handler: (message: ResT) => void): BidirectionalStream<ReqT, ResT>
  on(type: 'end', handler: (status?: Status) => void): BidirectionalStream<ReqT, ResT>
  on(type: 'status', handler: (status: Status) => void): BidirectionalStream<ReqT, ResT>
}

export class StatusClient {
  readonly serviceHost: string

  constructor(serviceHost: string, options?: grpc.RpcOptions)
  getStatus(
    requestMessage: status_pb.StatusRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError | null, responseMessage: status_pb.StatusResponse | null) => void
  ): UnaryResponse
  getStatus(
    requestMessage: status_pb.StatusRequest,
    callback: (error: ServiceError | null, responseMessage: status_pb.StatusResponse | null) => void
  ): UnaryResponse
}
