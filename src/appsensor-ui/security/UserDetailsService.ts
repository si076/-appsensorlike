class User {
	
	private username: string = '';
	
	private userAuthorities = new Set<Authority>();
	
	private groups = new Set<Group>();

	private clientApplications: string[] = [];

	public getUsername(): string {
		return this.username;
	}

	public setUsername(username: string) {
		this.username = username;
	}

	public getUserAuthorities(): Set<Authority> {
		return this.userAuthorities;
	}

	public setUserAuthorities(userAuthorities: Set<Authority>) {
		this.userAuthorities = userAuthorities;
	}

	public getGroups(): Set<Group> {
		return this.groups;
	}

	public setGroups(groups: Set<Group>) {
		this.groups = groups;
	}

	public getClientApplications(): string[] {
		return this.clientApplications;
	}

	public setClientApplications(clientApplications: string[]) {
		this.clientApplications = clientApplications;
	}
	
//	@Override
	public toString(): string {
		return "User [username=" + this.username + ", userAuthorities=" + this.userAuthorities + ", groups=" + this.groups
				+ ", clientApplications=" + this.clientApplications + "]";
	}

} 

class Group {
	
	private id: number = -1;
	
	private name: string = '';

	private users = new Set<User>();

	private authorities = new Set<Authority>();

	public getId(): number {
		return this.id;
	}

	public setId(id: number) {
		this.id = id;
	}

	public getName(): string {
		return this.name;
	}

	public setName(name: string) {
		this.name = name;
	}

	public getUsers(): Set<User> {
		return this.users;
	}

	public setUsers(users: Set<User>) {
		this.users = users;
	}

	public getAuthorities(): Set<Authority> {
		return this.authorities;
	}

	public setAuthorities(authorities: Set<Authority>) {
		this.authorities = authorities;
	}

	// @Override
	public toString(): string {
		return "Group [id=" + this.id + ", name=" + this.name + ", authorities=" + this.authorities + "]";	//users=" + users + ", 
	}
	
}

enum AUTHORITY_NAME {
	NONE               = 'NONE', 
	VIEW_DATA          = 'VIEW_DATA',
	VIEW_CONFIGURATION = 'VIEW_CONFIGURATION',
}

class Authority {
	
	private id: number = -1;

	private name: AUTHORITY_NAME = AUTHORITY_NAME.NONE;

	private users = new Set<User>();
	
	private groups = new Set<Group>();

	public getId(): number {
		return this.id;
	}

	public setId(id: number) {
		this.id = id;
	}

	public getName(): string {
		return this.name;
	}

	public setName(name: AUTHORITY_NAME) {
		this.name = name;
	}

	public getUsers(): Set<User> {
		return this.users;
	}

	public setUsers(users: Set<User>) {
		this.users = users;
	}

	public getGroups(): Set<Group> {
		return this.groups;
	}

	public setGroups(groups: Set<Group>) {
		this.groups = groups;
	}

	// @Override
	public toString(): string {
		return "Authority [id=" + this.id + ", name=" + this.name + "]";	//", users=" + users + ", groups=" + groups + "	
	}
	
}

interface UserDetails { //extends Express.User { //from @types/passport
    //Returns the authorities granted to the user.
    getAuthorities(): Authority[];

    //Returns the password used to authenticate the user.
    getPassword(): string;
    
    //Returns the username used to authenticate the user.
    getUsername(): string;
    
    //Indicates whether the user's account has expired.
    isAccountNonExpired(): boolean;
    
    //Indicates whether the user is locked or unlocked.
    isAccountNonLocked(): boolean;
    
    //Indicates whether the user's credentials (password) has expired.
    isCredentialsNonExpired(): boolean;
    
    //Indicates whether the user is enabled or disabled.
    isEnabled(): boolean;
}

interface UserDetailsService {
    
    loadUserByUsername(username: string): Promise<UserDetails | null>;
}

export {User, Group, AUTHORITY_NAME, Authority, UserDetails, UserDetailsService};