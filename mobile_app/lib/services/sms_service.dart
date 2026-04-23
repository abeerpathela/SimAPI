import 'package:telephony/telephony.dart';
import 'package:permission_handler/permission_handler.dart';

class SmsService {
  final Telephony telephony = Telephony.instance;

  Future<bool> requestPermissions() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.sms,
      Permission.phone,
    ].request();
    
    final permissions = await telephony.requestPhoneAndSmsPermissions;
    return (permissions ?? false) && 
           statuses[Permission.sms] == PermissionStatus.granted;
  }

  Future<void> sendSms({
    required String toNumber,
    required String message,
  }) async {
    print('📱 [SmsService] Attempting to send SMS to $toNumber');
    try {
      await telephony.sendSms(
        to: toNumber,
        message: message,
        isMultipart: true,
      );
      print('✅ [SmsService] SMS sent call successful');
    } catch (e) {
      print('❌ [SmsService] SMS send failed: $e');
      rethrow;
    }
  }

  void listenToIncomingSms(Function(SmsMessage) onMessage) {
    telephony.listenIncomingSms(
      onNewMessage: onMessage,
      listenInBackground: false,
    );
  }
}
