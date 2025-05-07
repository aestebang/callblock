import Foundation
import CallKit

@objc(CallBlocking)
class CallBlocking: NSObject {
    
    private var blockedNumbers: Set<String> = []
    private let userDefaults = UserDefaults.standard
    private let blockedNumbersKey = "blockedNumbers"
    
    override init() {
        super.init()
        loadBlockedNumbers()
    }
    
    private func loadBlockedNumbers() {
        if let savedNumbers = userDefaults.stringArray(forKey: blockedNumbersKey) {
            blockedNumbers = Set(savedNumbers)
        }
    }
    
    private func saveBlockedNumbers() {
        userDefaults.set(Array(blockedNumbers), forKey: blockedNumbersKey)
    }
    
    @objc
    func blockNumber(_ phoneNumber: String, callback: @escaping (Bool) -> Void) {
        // Remove any non-numeric characters from the phone number
        let cleanNumber = phoneNumber.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        
        // Add to blocked numbers set
        blockedNumbers.insert(cleanNumber)
        
        // Save to UserDefaults
        saveBlockedNumbers()
        
        // Update CallKit blocking list
        updateBlockedNumbers()
        
        callback(true)
    }
    
    @objc
    func unblockNumber(_ phoneNumber: String, callback: @escaping (Bool) -> Void) {
        // Remove any non-numeric characters from the phone number
        let cleanNumber = phoneNumber.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        
        // Remove from blocked numbers set
        blockedNumbers.remove(cleanNumber)
        
        // Save to UserDefaults
        saveBlockedNumbers()
        
        // Update CallKit blocking list
        updateBlockedNumbers()
        
        callback(true)
    }
    
    @objc
    func unblockNumbers(_ phoneNumbers: [String], callback: @escaping (Bool) -> Void) {
        // Remove any non-numeric characters from each phone number
        let cleanNumbers = phoneNumbers.map { number in
            number.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        }
        
        // Remove all numbers from blocked numbers set
        cleanNumbers.forEach { blockedNumbers.remove($0) }
        
        // Save to UserDefaults
        saveBlockedNumbers()
        
        // Update CallKit blocking list
        updateBlockedNumbers()
        
        callback(true)
    }
    
    @objc
    func removeAllBlockedNumbers(_ callback: @escaping (Bool) -> Void) {
        // Clear all blocked numbers
        blockedNumbers.removeAll()
        
        // Save to UserDefaults
        saveBlockedNumbers()
        
        // Update CallKit blocking list
        updateBlockedNumbers()
        
        callback(true)
    }
    
    @objc
    func getBlockedNumbers(_ callback: @escaping ([String]) -> Void) {
        // Return array of all blocked numbers
        callback(Array(blockedNumbers))
    }
    
    @objc
    func isNumberBlocked(_ phoneNumber: String, callback: @escaping (Bool) -> Void) {
        // Remove any non-numeric characters from the phone number
        let cleanNumber = phoneNumber.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        
        // Check if number is blocked
        callback(blockedNumbers.contains(cleanNumber))
    }
    
    @objc
    func blockNumbers(_ phoneNumbers: [String], callback: @escaping (Bool) -> Void) {
        // Remove any non-numeric characters from each phone number
        let cleanNumbers = phoneNumbers.map { number in
            number.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        }
        
        // Add all numbers to blocked numbers set
        cleanNumbers.forEach { blockedNumbers.insert($0) }
        
        // Save to UserDefaults
        saveBlockedNumbers()
        
        // Update CallKit blocking list
        updateBlockedNumbers()
        
        callback(true)
    }
    
    private func updateBlockedNumbers() {
        let provider = CXCallDirectoryProvider()
        let context = CXCallDirectoryExtensionContext()
        
        // Add all blocked numbers to the context
        for number in blockedNumbers {
            if let numberInt = Int64(number) {
                context.addBlockingEntry(withNextSequentialPhoneNumber: numberInt)
            }
        }
        
        // Save the context
        context.completeRequest { error in
            if let error = error {
                print("Error updating blocked numbers: \(error.localizedDescription)")
            }
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
} 