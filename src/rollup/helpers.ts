import { IdentityFn, RollupOpts } from "../types";

export function extendRollupOpts(
  rollupOpts: RollupOpts,
  extendRollupOptsFns: IdentityFn<RollupOpts>[]
): RollupOpts {
  return extendRollupOptsFns.reduce((currRollupOpts, extendFn) => {
    return extendFn(currRollupOpts);
  }, rollupOpts);
}

export function defaultExtendRollupOpts(rollupOpts: RollupOpts): RollupOpts {
  return rollupOpts;
}
