/* -*- Mode:C++; c-file-style:"gnu"; indent-tabs-mode:nil; -*- */

// #include <node.h>
#include <nan.h>

#include <turnclient.h>

namespace stunlib {

using namespace v8;

class TurnClient : public Nan::ObjectWrap
{
public:
  static
  NAN_MODULE_INIT(Init)
  {
    v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("TurnClient").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    SetPrototypeMethod(tpl, "StartAllocateTransaction", &TurnClient::StartAllocateTransaction);

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
//  *     tickMsec         -  Tells turnclient how often TurnClient_HandleTick() is called.
//  *     funcPtr          -  Will be called by Turn when it outputs management info and trace.
//  *     sendFunc         -  function used to send STUN packet. send(sockhandle,buff, len, turnServerAddr, userCtx)
//  *     turnCbFunc       -  user provided callback function used by turn to signal the result of an allocation or channel bind et   */
  static
  NAN_METHOD(StartAllocateTransaction)
  {
    TurnClient* obj = Nan::ObjectWrap::Unwrap<TurnClient>(info.This());

    if (!info[0]->IsNumber() ||
        !info[1]->IsFunction() ||
        !info[2]->IsFunction() ||
        !info[3]->IsFunction()) {
      Nan::ThrowTypeError("Wrong arguments");
      return;
    }

    uint32_t tickMsec = info[0]->NumberValue();

    obj->m_turnInfoFunc = info[1].As<v8::Function>();
    obj->m_turnSendFunc = info[2].As<v8::Function>();
    obj->m_turnCbFunc   = info[3].As<v8::Function>();

    TurnClient_StartAllocateTransaction(&obj->m_turnInstance,
                                        tickMsec,
                                        &TurnClient::turnInfoFunc,
                                        "icebox",
                                        static_cast<void*>(obj),
                                        0, //(struct sockaddr*)&taddr,
                                        "test\0",
                                        "pass\0",
                                        AF_INET,
                                        &TurnClient::turnSendFunc,
                                        &TurnClient::turnCbFunc,
                                        false,
                                        0);
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
      v8::Local<v8::Value> argv[argc] = {info[0]};
      v8::Local<v8::Function> cons = Nan::New(constructor());
      info.GetReturnValue().Set(cons->NewInstance(argc, argv));
    }
  }

  static Nan::Persistent<v8::Function>&
  constructor()
  {
    static Nan::Persistent<v8::Function> myConstructor;
    return myConstructor;
  }

private:
  static void
  turnInfoFunc(void* userCtx, TurnInfoCategory_T category, char* ErrStr)
  {
    TurnClient* obj = static_cast<TurnClient*>(userCtx);
    (void)obj;

    const unsigned argc = 0;
    v8::Local<v8::Value> argv[0] = { };
    Nan::MakeCallback(Nan::GetCurrentContext()->Global(), obj->m_turnInfoFunc, argc, argv);
  }


  static void
  turnSendFunc(const uint8_t*         buffer,
               size_t                 bufLen,
               const struct sockaddr* dstAddr,
               void*                  userCtx)
  {
    TurnClient* obj = static_cast<TurnClient*>(userCtx);
    (void)obj;

    const unsigned argc = 0;
    v8::Local<v8::Value> argv[0] = { };
    Nan::MakeCallback(Nan::GetCurrentContext()->Global(), obj->m_turnSendFunc, argc, argv);
  }

  static void
  turnCbFunc(void*               userCtx,
             TurnCallBackData_T* turnCbData)
  {
    TurnClient* obj = static_cast<TurnClient*>(userCtx);
    (void)obj;

    const unsigned argc = 0;
    v8::Local<v8::Value> argv[0] = { };
    Nan::MakeCallback(Nan::GetCurrentContext()->Global(), obj->m_turnCbFunc, argc, argv);
  }

private:
  TURN_INSTANCE_DATA* m_turnInstance;

  v8::Local<v8::Function> m_turnInfoFunc;
  v8::Local<v8::Function> m_turnSendFunc;
  v8::Local<v8::Function> m_turnCbFunc;
};

NAN_MODULE_INIT(InitAll)
{
  TurnClient::Init(target);
}

} // namespace stunlib

NODE_MODULE(StunlibWrapper, stunlib::InitAll)
