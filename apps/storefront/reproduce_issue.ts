
import { validateAndNormalizeConfigurationInput, isSlotId, sortSlotIds } from './lib/keypadConfiguration';

const payload = {
    _meta: { rotation: 90 },
    slot_1: { iconId: '001', color: null }
};

console.log('isSlotId("_meta"):', isSlotId('_meta'));
console.log('sortSlotIds(["_meta", "slot_1"]):', sortSlotIds(['_meta', 'slot_1']));

const result = validateAndNormalizeConfigurationInput(payload, {
    slotIds: ['slot_1']
});

console.log('Validation Result:', JSON.stringify(result, null, 2));

if (!result.ok && result.error.includes('Unexpected slot key')) {
    console.error('FAIL: Unexpected slot key error triggered');
    process.exit(1);
} else {
    console.log('PASS: Validation passed or failed with different error');
}
