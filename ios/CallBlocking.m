#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CallBlocking, NSObject)

RCT_EXTERN_METHOD(blockNumber:(NSString *)phoneNumber
                  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(unblockNumber:(NSString *)phoneNumber
                  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(unblockNumbers:(NSArray *)phoneNumbers
                  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(removeAllBlockedNumbers:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getBlockedNumbers:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(isNumberBlocked:(NSString *)phoneNumber
                  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(blockNumbers:(NSArray *)phoneNumbers
                  callback:(RCTResponseSenderBlock)callback)

@end 