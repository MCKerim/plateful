import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

/**
 * A write shown at once: `optimistic` rewrites the cached data before the
 * request, a failure restores it and refetches. Every write of a feature
 * shares one `mutationKey`, which the realtime handler in App waits on, so a
 * refetch never lands older than the screen while a write is in flight.
 * `optimistic` gets the cache as it is (undefined when nothing is loaded yet)
 * and may answer undefined to leave it alone.
 */
export function useOptimisticMutation<TData, TVariables, TResult>(options: {
  mutationKey: QueryKey;
  queryKey: (variables: TVariables) => QueryKey;
  mutationFn: (variables: TVariables) => Promise<TResult>;
  optimistic: (data: TData | undefined, variables: TVariables) => TData | undefined;
  onSuccess?: (result: TResult, variables: TVariables) => void;
  /** After the rollback, for a screen that tells the user. */
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: options.mutationKey,
    mutationFn: options.mutationFn,
    onMutate: async (variables: TVariables) => {
      const queryKey = options.queryKey(variables);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData>(queryKey);
      queryClient.setQueryData<TData>(queryKey, (data) => options.optimistic(data, variables));
      return { previous };
    },
    onSuccess: options.onSuccess,
    onError: (error, variables, context) => {
      const queryKey = options.queryKey(variables);
      // Another write's optimistic state lives in the cache; restoring this
      // snapshot would drop it. The refetch below shows the server's truth.
      const alone = queryClient.isMutating({ mutationKey: options.mutationKey }) === 1;
      if (alone && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      void queryClient.invalidateQueries({ queryKey });
      options.onError?.(error);
    },
  });
}
