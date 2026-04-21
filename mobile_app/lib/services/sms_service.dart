import 'package:telephony/telephony.dart';

class SmsService {
  final Telephony telephony = Telephony.instance;

  Future<bool> requestPermissions() async {
    final permissions = await telephony.requestPhoneAndSmsPermissions;
    return permissions ?? false;
  }

  Future<void> sendSms({
    required String toNumber,
    required String message,
  }) async {
    await telephony.sendSms(
      to: toNumber,
      message: message,
      isMultipart: true,
    );
  }

  void listenToIncomingSms(Function(SmsMessage) onMessage) {
    telephony.listenIncomingSms(
      onNewMessage: onMessage,
      listenInBackground: false,
    );
  }
}
