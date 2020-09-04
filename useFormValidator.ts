import { ConfigureOptionType } from './types';

export function useFormValidator(configureOptions?: ConfigureOptionType) {
  useEffect(() => {
    validator.configure(configureOptions || {});

    return () => {
      validator.clear();
    };
  }, [configureOptions]);
}
