import { useQuery } from "@tanstack/react-query";
import { usersService } from "../services/users.service";

export const useMe = () => {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: () => usersService.me(),
  });
};
