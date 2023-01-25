/**
 * 合并条件表达式
 */

function disabilityAmout() {
    if (_seniority < 2) return 0;
    if (_monthsDisabled > 12) return 0;
    if (_isPartTime) return 0;
    // compute the disability amount
}

// => 重构

function disabilityAmout_v1() {
    if (isNotEligibleForDisability()) return 0;
    // compute the disability amount
}

function isNotEligibleForDisability() {
    return ((_seniority < 2) || (_monthsDisabled > 12) || (_isPartTime));
}

