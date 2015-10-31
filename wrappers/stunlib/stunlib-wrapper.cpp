/* -*- Mode:C++; c-file-style:"gnu"; indent-tabs-mode:nil; -*- */

// #include <node.h>
#include <nan.h>
#include <turnclient.h>

#include "sockethelper.hpp"

extern "C" {
#include <sockaddr_util.h>
}

namespace stunlib {

using namespace v8;

class TurnClient : public Nan::ObjectWrap
{
public:
  static
  NAN_MODULE_INIT(Init)
  {
    Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("TurnClient").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    SetPrototypeMethod(tpl, "StartAllocateTransaction", &TurnClient::StartAllocateTransaction);
    SetPrototypeMethod(tpl, "HandleIncResp", &TurnClient::HandleIncResp);
    SetPrototypeMethod(tpl, "HandleTick", &TurnClient::HandleTick);

    constructor().Reset(Nan::GetFunction(tpl).ToLocalChecked());
    Nan::Set(target, Nan::New("TurnClient").ToLocalChecked(),
             Nan::GetFunction(tpl).ToLocalChecked());
  }

  /**
   * Javascript wrapper for StartAllocateTransaction
   *
   * var obj = stunlibWrapper.newFactoryObjectInstance();
   * obj.StartAllocateTransaction()
   *
   *     tickMsec   - Tells turnclient how often TurnClient_HandleTick() is called.
   *     funcPtr    - Will be called by Turn when it outputs management info and trace.
   *     sendFunc   - function used to send STUN packet. send(sockhandle,buff, len,
   *                  turnServerAddr, userCtx)
   *     turnCbFunc - user provided callback function used by turn to signal the result of an
   *                  allocation or channel bind et
   */
  static
  NAN_METHOD(StartAllocateTransaction)
  {
    TurnClient* obj = Nan::ObjectWrap::Unwrap<TurnClient>(info.This());

    if (!info[0]->IsNumber() || // tickMsec
        !info[1]->IsString() || // hostname
        !info[2]->IsNumber() || // port
        !info[3]->IsFunction() || // turnInfoFunc
        !info[4]->IsFunction() || // turnSendFunc
        !info[5]->IsFunction()) { // turnCbFunc
      Nan::ThrowTypeError("Wrong arguments");
      return;
    }

    uint32_t tickMsec = info[0]->NumberValue();

    Local<String> jsHostname = info[1]->ToString();
    const int length = jsHostname->Utf8Length() + 1;  // Add one for trailing zero byte.
    char* hostname = new char[length];
    jsHostname->WriteOneByte(reinterpret_cast<uint8_t*>(hostname), 0, length);

    uint16_t port = info[2]->NumberValue();

    obj->m_turnInfoFunc = new Nan::Callback(info[3].As<Function>());
    obj->m_turnSendFunc = new Nan::Callback(info[4].As<Function>());
    obj->m_turnCbFunc   = new Nan::Callback(info[5].As<Function>());

    if (0 != getSockaddrFromFqdn((struct sockaddr*)&obj->m_taddr, hostname, port)) {
      Nan::ThrowTypeError("Error getting TURN Server IP");
      return;
    }

    TurnClient_StartAllocateTransaction(&obj->m_turnInstance,
                                        tickMsec,
                                        &TurnClient::turnInfoFunc,
                                        "icebox",
                                        static_cast<void*>(obj),
                                        (struct sockaddr*)&obj->m_taddr,
                                        "test\0",
                                        "pass\0",
                                        AF_INET,
                                        &TurnClient::turnSendFunc,
                                        &TurnClient::turnCbFunc,
                                        false,
                                        0);
  }

  static
  NAN_METHOD(HandleIncResp)
  {
    TurnClient* obj = Nan::ObjectWrap::Unwrap<TurnClient>(info.This());

    uint8_t* buffer = (uint8_t*)node::Buffer::Data(info[0]->ToObject());
    uint32_t size = info[1]->Uint32Value();

    stunlib_DecodeMessage(buffer, size, &obj->stunMsg, 0, 0);
    TurnClient_HandleIncResp(obj->m_turnInstance, &obj->stunMsg, buffer);
  }

  static
  NAN_METHOD(HandleTick)
  {
    TurnClient* obj = Nan::ObjectWrap::Unwrap<TurnClient>(info.This());

    TurnClient_HandleTick(obj->m_turnInstance);
  }

private:
  static
  NAN_METHOD(New)
  {
    if (info.IsConstructCall()) {
      TurnClient* obj = new TurnClient;
      obj->Wrap(info.This());
      info.GetReturnValue().Set(info.This());
    }
    else {
      const int argc = 1;
      Local<Value> argv[argc] = {info[0]};
      Local<Function> cons = Nan::New(constructor());
      info.GetReturnValue().Set(cons->NewInstance(argc, argv));
    }
  }

  static Nan::Persistent<Function>&
  constructor()
  {
    static Nan::Persistent<Function> myConstructor;
    return myConstructor;
  }

private:
  static void
  turnInfoFunc(void* userCtx, TurnInfoCategory_T category, char* ErrStr)
  {
    TurnClient* obj = static_cast<TurnClient*>(userCtx);
    (void)obj;

    Local<Value> argv[0] = { };
    obj->m_turnInfoFunc->Call(0, argv);
  }

  static Local<Value>
  getHostValue(const struct sockaddr* addr)
  {
    char host[256];
    sockaddr_toString(addr, host, 256, false);
    return Nan::New<String>(host).ToLocalChecked();
  }

  static Local<Value>
  getPortValue(const struct sockaddr* addr)
  {
    uint16_t port = sockaddr_ipPort(addr);
    return Nan::New<Integer>(port);
  }

  static void
  turnSendFunc(const uint8_t*         buffer,
               size_t                 bufLen,
               const struct sockaddr* dstAddr,
               void*                  userCtx)
  {
    TurnClient* obj = static_cast<TurnClient*>(userCtx);

    Local<Object> jsBuffer = Nan::CopyBuffer(reinterpret_cast<const char*>(buffer), bufLen).ToLocalChecked();

    Local<Value> argv[] = { jsBuffer,
                            getHostValue(dstAddr), getPortValue(dstAddr) };
    obj->m_turnSendFunc->Call(3, argv);
  }

  static Local<Value>
  getHostPortValue(const sockaddr_storage& addr)
  {
    Local<Object> retval = Nan::New<Object>();
    retval->Set(Nan::New<String>("host").ToLocalChecked(), getHostValue((const sockaddr*)&addr));
    retval->Set(Nan::New<String>("port").ToLocalChecked(), getPortValue((const sockaddr*)&addr));
    return retval;
  }

  static void
  turnCbFunc(void*               userCtx,
             TurnCallBackData_T* turnCbData)
  {
    TurnClient* obj = static_cast<TurnClient*>(userCtx);

    Local<Object> cbData = Nan::New<Object>();

    if (turnCbData->turnResult == TurnResult_AllocOk) {

      cbData->Set(Nan::New<String>("activeTurnServer").ToLocalChecked(),
                  getHostPortValue(turnCbData->TurnResultData.AllocResp.activeTurnServerAddr));

      cbData->Set(Nan::New<String>("srflxAddr").ToLocalChecked(),
                  getHostPortValue(turnCbData->TurnResultData.AllocResp.srflxAddr));

      cbData->Set(Nan::New<String>("relAddrIPv4").ToLocalChecked(),
                  getHostPortValue(turnCbData->TurnResultData.AllocResp.relAddrIPv4));

      cbData->Set(Nan::New<String>("relAddrIPv6").ToLocalChecked(),
                  getHostPortValue(turnCbData->TurnResultData.AllocResp.relAddrIPv6));

      cbData->Set(Nan::New<String>("token").ToLocalChecked(),
                  Nan::CopyBuffer(reinterpret_cast<const char*>(&turnCbData->TurnResultData.AllocResp.token),
                                  sizeof(turnCbData->TurnResultData.AllocResp.token)).ToLocalChecked());
    }

    Local<Value> argv[] = { cbData };
    obj->m_turnCbFunc->Call(1, argv);
  }

private:
  TURN_INSTANCE_DATA* m_turnInstance;

  Nan::Callback* m_turnInfoFunc;
  Nan::Callback* m_turnSendFunc;
  Nan::Callback* m_turnCbFunc;

  struct sockaddr_storage m_taddr;
  StunMessage stunMsg;
};


NAN_METHOD(IsStunMsg)
{
  const uint8_t* buffer = (const uint8_t*)node::Buffer::Data(info[0]->ToObject());
  uint32_t size = info[1]->Uint32Value();

  bool isStun = stunlib_isStunMsg(buffer, size);

  info.GetReturnValue().Set(Nan::New<BooleanObject>(isStun));
}


NAN_MODULE_INIT(InitAll)
{
  TurnClient::Init(target);

  target->Set(Nan::New("IsStunMsg").ToLocalChecked(),
              Nan::New<v8::FunctionTemplate>(&IsStunMsg)->GetFunction());
}

} // namespace stunlib

NODE_MODULE(StunlibWrapper, stunlib::InitAll)
