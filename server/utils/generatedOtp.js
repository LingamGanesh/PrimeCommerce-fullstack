import { randomInt } from "node:crypto";

const generatedOtp = () => String(randomInt(100000, 1000000));

export default generatedOtp;
